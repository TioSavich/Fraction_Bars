export default class SplitsWidget {
    constructor(canvasContext) {
        this.context = canvasContext;
        this.images = [];
        this.vertical = true;
        this.num_splits = 2;
        this.color = "yellow";
    }

    handleSliderChange(event, ui) {
        this.num_splits = ui.value;
        this.refreshCanvas();
    }

    handleVertHorizChange(event) {
        const the_checked = document.querySelector("input:checked").value;
        this.vertical = the_checked === "Vertical";
        this.refreshCanvas();
    }

    refreshCanvas() {
        this.context.strokeStyle = "#FF3333";
        this.context.fillStyle = this.color;
        const width = document.getElementById("split-display").width;
        let height = document.getElementById("split-display").height;
        this.context.fillRect(0, 0, width, height);

        if (this.vertical) {
            const splitWidth = width / this.num_splits;
            for (let i = 0; i < this.num_splits; i++) {
                this.context.strokeRect(i * splitWidth, 0, splitWidth, height);
            }
        } else {
            const splitHeight = height / this.num_splits;
            for (let j = 0; j < this.num_splits; j++) {
                this.context.strokeRect(0, j * splitHeight, width, splitHeight);
            }
        }

        this.refreshed = true;
    }
}