/**
 * @type CanvasRenderingContext2D
 */
let ctx;
let startTimestamp;

const gridLength = 50;

const lorentzTransform = (pos, v, c) => {
	const lF = Math.sqrt(1 - (v**2) / c**2);
	
	return {
		x: lF * (pos.x - v * pos.t),
		t: lF * (pos.t - (v * pos.x / (c**2))),
	}
}

let running = false;
const c = 1.0;

const dt = 0.01;
const generatePath = (initialPos, deltaT, initialV, finalV) => {
	let elapsed = 0;
	let t = initialPos.t;
	let x = initialPos.x;

	const dvdt = (finalV - initialV) / deltaT;
	let v = initialV;
	let path = [{t, x}];
	
	while (elapsed <= deltaT) {
		t += dt;
		elapsed += dt;
		x += v * dt;
		v += dvdt * dt;

		path.push({x, t});
	}

	return path;
}

const lerpPath = (path, time) => {
	for (let i = 0; i < path.length; i++) {
		const thisNode = path[i];
		const nextNode = path[i+1];
		
		if (nextNode === undefined) {
			return {
				...thisNode,
				v: ((thisNode.x - path[i-1].x) / (thisNode.t - path[i-1].t))
			};
		}
		
				const t0 = thisNode.t;
				const t1 = nextNode.t;
				const x0 = thisNode.x;
				const x1 = nextNode.x;

		if (time < thisNode.t || nextNode.t < time) {
			continue;
		}

		// console.log(thisNode, nextNode, (x0 * (t1 - time) + x0 * (time - t0)) / (t1 - t0));

		return {
			t: time,
			x: (x0 * (t1 - time) + x1 * (time - t0)) / (t1 - t0),
			v: (x1 - x0) / (t1 - t0),
		};
	}

}

let time = 0;
let timestep = 1/60;
let focusingRed = false;

const draw = () => {
	ctx.canvas.width  = window.innerWidth;
	ctx.canvas.height = window.innerHeight;
	const fancyPath = [{t: 0, x: 1}, {t: 5, x: 1}].concat(generatePath({t: 5, x: 1}, 5, 0, 0.8)).concat([{t: 10, x: 3}, {t:100, x: 75}]);
	// let currentPos = {t: i / 60, x: i / 60 * v};
	// let currentPos = {t: 0, x: 0};
	let currentPos = lerpPath(focusingRed ? fancyPath : [{t: 0, x: 0}, {t: 100, x: 0}], time);
	const v = currentPos.v;
	
	drawGrid(currentPos, v, 1.0);
	
	drawPath([{t: 0, x: 0}, {t: 100, x: 100}], currentPos, v, c, 'yellow');
	drawPath([{t: 0, x: 0}, {t: 100, x: -100}], currentPos, v, c, 'yellow');
	drawPath(fancyPath, currentPos, v, c, 'red');
	drawPath([{t: 0, x: 0}, {t: 100, x: 0}], currentPos, v, c, 'blue');
	
	// ctx.fillStyle = 'rgb(255, 0, 0)';
	// ctx.fillRect(10, 10, 50, 50);
	
	if (running) {
		time += timestep / Math.sqrt(1 - v**2 / c**2);
	}
	requestAnimationFrame(draw);
}


const screenToWorld = pos => {
	return {
		t: (pos.x - ctx.canvas.width / 2) / gridLength,
		x: (pos.y - ctx.canvas.height / 2) / gridLength,
	};
}

const worldToScreen = pos => {
	return {
		x: pos.t * gridLength + (ctx.canvas.width / 2),
		y: -pos.x * gridLength + (ctx.canvas.height / 2),
	}
}

const drawPath = (path, pos, velocity, c, style) => {
	ctx.beginPath();
	ctx.strokeStyle = style;
	path.forEach(node => {
		const point = worldToScreen(lorentzTransform({t: node.t - pos.t, x: node.x - pos.x}, velocity, c));
		ctx.lineTo(point.x, point.y);
	});
	ctx.stroke();
}

const drawGrid = (pos, velocity, c) => {
	const primaryColor = '#FFF';
	const secondaryColor = '#78716C';
	const width = ctx.canvas.width;
	const height = ctx.canvas.height;
	
	// console.log(width, height);

	ctx.beginPath();
	ctx.lineWidth = 1;
	ctx.strokeStyle = secondaryColor;
	let offset = pos.t * gridLength;

	for (let x = 0; x < width + offset; x += gridLength) {
		const lineX = x + (width % (gridLength * 2)) / 2 - offset;
		
		const start = worldToScreen(lorentzTransform(screenToWorld({x: lineX, y: 0}), velocity, c));
		const end = worldToScreen(lorentzTransform(screenToWorld({x: lineX, y: height}), velocity, c));
		ctx.moveTo(start.x, start.y);
		ctx.lineTo(end.x, end.y);
	}
	offset = pos.x * gridLength;
	for (let y = 0; y < ctx.canvas.height; y += gridLength) {
		const lineY = y + (height % (gridLength * 2)) / 2 - offset;

		const start = worldToScreen(lorentzTransform(screenToWorld({x: 0, y: lineY}), velocity, c));
		const end = worldToScreen(lorentzTransform(screenToWorld({x: width, y: lineY}), velocity, c));

		ctx.moveTo(start.x, start.y);
		ctx.lineTo(end.x, end.y);
	}
	ctx.stroke();

	// Axis
	ctx.beginPath();
	ctx.strokeStyle = '#FFF';
	
	ctx.moveTo(width / 2, 0);
	ctx.lineTo(width / 2, height);
	
	ctx.moveTo(0, height / 2);
	ctx.lineTo(width, height / 2);
	
	ctx.stroke();
}

const main = () => {
	const canvas = document.getElementById('lab-canvas');

	if (!canvas.getContext) {
		alert('Your browser doesn\'t support canvas. Please stop using Internet Explorer');
		return;
	}
	ctx = canvas.getContext('2d');

	const pauseButton = document.getElementById('ui-pause');
	const resetButton = document.getElementById('ui-reset');
	const focusRedButton = document.getElementById('ui-path-red');
	const focusBlueButton = document.getElementById('ui-path-blue');

	pauseButton.addEventListener('click', () => {
		running = !running;
		resetButton.classList.remove('disabled');
		focusRedButton.classList.add('disabled')
		focusBlueButton.classList.add('disabled')
		if (running) {
			pauseButton.innerText = 'Pause';
		} else {
			pauseButton.innerText = 'Resume';
		}
	});

	resetButton.addEventListener('click', () => {
		if (resetButton.classList.contains('disabled')) {
			return;
		}
		running = false;
		time = 0;
		pauseButton.innerText = 'Start';
		focusRedButton.classList.remove('disabled')
		focusBlueButton.classList.remove('disabled')
	});
	
	focusRedButton.addEventListener('click', () => {
		if (focusRedButton.classList.contains('disabled')) {
			return;
		}
		focusingRed = true;
	});
	focusBlueButton.addEventListener('click', () => {
		if (focusBlueButton.classList.contains('disabled')) {
			return;
		}
		focusingRed = false;
	});

	requestAnimationFrame(draw)
}

window.onload = main;