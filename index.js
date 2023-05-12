let ctx;
let startTimestamp;

const draw = () => {
	ctx.canvas.width  = window.innerWidth;
	ctx.canvas.height = window.innerHeight;

	drawGrid();

	// ctx.fillStyle = 'rgb(255, 0, 0)';
	// ctx.fillRect(10, 10, 50, 50);

	requestAnimationFrame(draw);
}

const drawGrid = () => {
	ctx.fillStyle = '#78716C';
	const width = ctx.canvas.width;
	const height = ctx.canvas.height;
	
	// console.log(width, height);
	const gridThickness = 1;

	for (let x = 0; x < width; x += 50) {
		ctx.fillRect(x, 0, gridThickness, height);
	}
	for (let y = 0; y < ctx.canvas.height; y += 50) {
		ctx.fillRect(0, y, width, gridThickness);
	}
}

const main = () => {
	const canvas = document.getElementById('lab-canvas');

	if (!canvas.getContext) {
		alert('Your browser doesn\'t support canvas. Please stop using Internet Explorer');
		return;
	}
	ctx = canvas.getContext('2d');

	requestAnimationFrame(draw)
}

window.onload = main;