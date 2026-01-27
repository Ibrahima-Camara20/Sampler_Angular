class TrimbarsDrawer {
  leftTrimBar = { x: 0, color: "white", selected: false, dragged: false };
  rightTrimBar = { x: 0, color: "white", selected: false, dragged: false };

  constructor(canvas, leftTrimBarX, rightTrimBarX) {
    this.canvas = canvas;
    this.leftTrimBar.x = leftTrimBarX || 0;
    this.rightTrimBar.x = rightTrimBarX || canvas.width;
    this.ctx = canvas.getContext('2d');
  }

  draw() {
    const ctx = this.ctx;
    ctx.save();

    ctx.lineWidth = 2;

    // left
    ctx.strokeStyle = this.leftTrimBar.color;
    ctx.beginPath();
    ctx.moveTo(this.leftTrimBar.x, 0);
    ctx.lineTo(this.leftTrimBar.x, this.canvas.height);
    ctx.stroke();

    // right
    ctx.beginPath();
    ctx.strokeStyle = this.rightTrimBar.color;
    ctx.moveTo(this.rightTrimBar.x, 0);
    ctx.lineTo(this.rightTrimBar.x, this.canvas.height);
    ctx.stroke();

    // triangle left
    ctx.fillStyle = this.leftTrimBar.color;
    ctx.beginPath();
    ctx.moveTo(this.leftTrimBar.x, 0);
    ctx.lineTo(this.leftTrimBar.x + 10, 8);
    ctx.lineTo(this.leftTrimBar.x, 16);
    ctx.fill();

    // triangle right
    ctx.beginPath();
    ctx.fillStyle = this.rightTrimBar.color;
    ctx.moveTo(this.rightTrimBar.x, 0);
    ctx.lineTo(this.rightTrimBar.x - 10, 8);
    ctx.lineTo(this.rightTrimBar.x, 16);
    ctx.fill();

    // grey zones
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillRect(0, 0, this.leftTrimBar.x, this.canvas.height);
    ctx.fillRect(this.rightTrimBar.x, 0, this.canvas.width, this.canvas.height);

    ctx.restore();
  }

  highLightTrimBarsWhenClose(mousePos) {
    const DETECTION_ZONE = 30;

    const distLeft = Math.abs(mousePos.x - this.leftTrimBar.x);
    const distRight = Math.abs(mousePos.x - this.rightTrimBar.x);

    if (distLeft < distRight && distLeft < DETECTION_ZONE) {
      this.leftTrimBar.color = "red";
      this.leftTrimBar.selected = true;
      this.rightTrimBar.color = "white";
      this.rightTrimBar.selected = false;
    } else if (distRight < distLeft && distRight < DETECTION_ZONE) {
      this.rightTrimBar.color = "red";
      this.rightTrimBar.selected = true;
      this.leftTrimBar.color = "white";
      this.leftTrimBar.selected = false;
    } else {
      this.leftTrimBar.color = "white";
      this.leftTrimBar.selected = false;
      this.rightTrimBar.color = "white";
      this.rightTrimBar.selected = false;
    }
  }

  startDrag() {
    if (this.leftTrimBar.selected) this.leftTrimBar.dragged = true;
    if (this.rightTrimBar.selected) this.rightTrimBar.dragged = true;
  }

  stopDrag() {
    if (this.leftTrimBar.dragged) {
      this.leftTrimBar.dragged = false;
      this.leftTrimBar.selected = false;
      if (this.leftTrimBar.x > this.rightTrimBar.x) this.leftTrimBar.x = this.rightTrimBar.x;
    }

    if (this.rightTrimBar.dragged) {
      this.rightTrimBar.dragged = false;
      this.rightTrimBar.selected = false;
      if (this.rightTrimBar.x < this.leftTrimBar.x) this.rightTrimBar.x = this.leftTrimBar.x;
    }
  }

  moveTrimBars(mousePos) {
    if (this.leftTrimBar.dragged) {
      this.leftTrimBar.x = Math.max(0, Math.min(mousePos.x, this.rightTrimBar.x));
      return;
    }

    if (this.rightTrimBar.dragged) {
      this.rightTrimBar.x = Math.max(this.leftTrimBar.x, Math.min(mousePos.x, this.canvas.width));
      return;
    }

    this.highLightTrimBarsWhenClose(mousePos);
  }

  getTrimValues() {
    return {
      start: this.leftTrimBar.x / this.canvas.width,
      end: this.rightTrimBar.x / this.canvas.width
    };
  }

  setTrimValues(start, end) {
    this.leftTrimBar.x = start * this.canvas.width;
    this.rightTrimBar.x = end * this.canvas.width;
  }
}

if (typeof window !== 'undefined') {
  window.TrimbarsDrawer = TrimbarsDrawer;
}
