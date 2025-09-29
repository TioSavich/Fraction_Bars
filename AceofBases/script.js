document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('cubeCanvas');
    const ctx = canvas.getContext('2d');
    const composeButton = document.getElementById('composeButton');
    const decomposeButton = document.getElementById('decomposeButton');
    const addCubeButton = document.getElementById('addCubeButton');
    const removeCubeButton = document.getElementById('removeCubeButton');
    const selectedUnitsDisplay = document.getElementById('selectedUnits');
    const baseConversionDisplay = document.getElementById('baseConversion');
    const baseTenCountDisplay = document.getElementById('baseTenCount');
    const explanationPopup = document.getElementById('explanationPopup');
    const overflowPopup = document.getElementById('overflowPopup');

    let cubes = [];
    let selectedUnits = 0;
    let modulus = 0;
    let isDragging = false;
    let dragOffsetX, dragOffsetY;
    let draggedCube = null;
    let isSelecting = false;
    let selectionStartX, selectionStartY;

    const generateRandomCubes = () => {
        const count = Math.floor(Math.random() * 14) + 2;
        cubes = Array.from({ length: count }, (_, i) => ({
            x: Math.random() * (canvas.width - 20),
            y: Math.random() * (canvas.height - 20),
            size: 20,
        }));
        drawCubes();
    };

    const drawCubes = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        cubes.forEach(cube => {
            ctx.fillStyle = 'blue';
            ctx.fillRect(cube.x, cube.y, cube.size, cube.size);
        });
    };

    const handleMouseDown = (e) => {
        const rect = canvas.getBoundingClientRect();
        const startX = e.clientX - rect.left;
        const startY = e.clientY - rect.top;

        draggedCube = cubes.find(cube => (
            startX >= cube.x && startX <= cube.x + cube.size &&
            startY >= cube.y && startY <= cube.y + cube.size
        ));

        if (draggedCube) {
            isDragging = true;
            dragOffsetX = startX - draggedCube.x;
            dragOffsetY = startY - draggedCube.y;
        } else {
            isSelecting = true;
            selectionStartX = startX;
            selectionStartY = startY;
            canvas.addEventListener('mousemove', handleMouseMove);
            canvas.addEventListener('mouseup', handleMouseUp);
        }
    };

    const handleMouseMove = (e) => {
        if (isSelecting) {
            const rect = canvas.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawCubes();
            ctx.strokeStyle = 'red';
            ctx.strokeRect(selectionStartX, selectionStartY, currentX - selectionStartX, currentY - selectionStartY);
        }
    };

    const handleMouseUp = (e) => {
        if (isSelecting) {
            const rect = canvas.getBoundingClientRect();
            const endX = e.clientX - rect.left;
            const endY = e.clientY - rect.top;
            const selected = cubes.filter(cube => (
                cube.x >= Math.min(selectionStartX, endX) && cube.x <= Math.max(selectionStartX, endX) &&
                cube.y >= Math.min(selectionStartY, endY) && cube.y <= Math.max(selectionStartY, endY)
            ));
            selectedUnits = Math.min(selected.length, 15);
            selectedUnitsDisplay.textContent = `Selected Units: ${selectedUnits}`;
            modulus = selectedUnits;

            if (selectedUnits > 10) {
                explanationPopup.style.display = 'block';
            } else {
                explanationPopup.style.display = 'none';
            }

            isSelecting = false;
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseup', handleMouseUp);
        }
    };

    const handleTouchStart = (e) => {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const startX = touch.clientX - rect.left;
        const startY = touch.clientY - rect.top;

        draggedCube = cubes.find(cube => (
            startX >= cube.x && startX <= cube.x + cube.size &&
            startY >= cube.y && startY <= cube.y + cube.size
        ));

        if (draggedCube) {
            isDragging = true;
            dragOffsetX = startX - draggedCube.x;
            dragOffsetY = startY - draggedCube.y;
        } else {
            isSelecting = true;
            selectionStartX = startX;
            selectionStartY = startY;
            canvas.addEventListener('touchmove', handleTouchMove);
            canvas.addEventListener('touchend', handleTouchEnd);
        }
    };

    const handleTouchMove = (e) => {
        if (isSelecting) {
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const currentX = touch.clientX - rect.left;
            const currentY = touch.clientY - rect.top;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawCubes();
            ctx.strokeStyle = 'red';
            ctx.strokeRect(selectionStartX, selectionStartY, currentX - selectionStartX, currentY - selectionStartY);
        } else if (isDragging && draggedCube) {
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            draggedCube.x = touch.clientX - rect.left - dragOffsetX;
            draggedCube.y = touch.clientY - rect.top - dragOffsetY;
            drawCubes();
        }
    };

    const handleTouchEnd = (e) => {
        if (isSelecting) {
            const rect = canvas.getBoundingClientRect();
            const touch = e.changedTouches[0];
            const endX = touch.clientX - rect.left;
            const endY = touch.clientY - rect.top;
            const selected = cubes.filter(cube => (
                cube.x >= Math.min(selectionStartX, endX) && cube.x <= Math.max(selectionStartX, endX) &&
                cube.y >= Math.min(selectionStartY, endY) && cube.y <= Math.max(selectionStartY, endY)
            ));
            selectedUnits = Math.min(selected.length, 15);
            selectedUnitsDisplay.textContent = `Selected Units: ${selectedUnits}`;
            modulus = selectedUnits;

            if (selectedUnits > 10) {
                explanationPopup.style.display = 'block';
            } else {
                explanationPopup.style.display = 'none';
            }

            isSelecting = false;
            canvas.removeEventListener('touchmove', handleTouchMove);
            canvas.removeEventListener('touchend', handleTouchEnd);
        }
    };

    const handleDrag = (e) => {
        if (isDragging && draggedCube) {
            const rect = canvas.getBoundingClientRect();
            draggedCube.x = e.clientX - rect.left - dragOffsetX;
            draggedCube.y = e.clientY - rect.top - dragOffsetY;
            drawCubes();
        }
    };

    const handleDragEnd = (e) => {
        isDragging = false;
        draggedCube = null;
    };

    const updateBaseConversion = () => {
        if (modulus > 1) {
            const base = modulus;
            const baseStr = convertToBase(cubes.length, base);

            if (baseStr.length > 4) {
                overflowPopup.style.display = 'block';
                return;
            }

            const baseComponents = { rods: 0, flats: 0, cubes3D: 0, units: 0 };
            let count = cubes.length;

            while (count > 0) {
                if (count >= base * base * base) {
                    baseComponents.cubes3D++;
                    count -= base * base * base;
                } else if (count >= base * base) {
                    baseComponents.flats++;
                    count -= base * base;
                } else if (count >= base) {
                    baseComponents.rods++;
                    count -= base;
                } else {
                    baseComponents.units++;
                    count--;
                }
            }

            baseConversionDisplay.textContent = `Base ${base}: ${baseStr}`;
            baseTenCountDisplay.textContent = `Base 10: ${cubes.length}`;
            drawBaseComponents(base, baseComponents);
        }
    };

    const convertToBase = (number, base) => {
        const digitMap = { 10: 'T', 11: 'E', 12: 'D', 13: 'R', 14: 'F' };
        let result = '';
        while (number > 0) {
            let digit = number % base;
            if (digit >= 10 && digit <= 14) {
                digit = digitMap[digit];
            }
            result = digit.toString() + result;
            number = Math.floor(number / base);
        }
        return result;
    };

    const drawBaseComponents = (base, baseComponents) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let xOffset = 0;
        let yOffset = 0;

        // Draw units
        for (let i = 0; i < baseComponents.units; i++) {
            ctx.fillStyle = 'blue';
            ctx.fillRect(xOffset, yOffset, 20, 20);
            xOffset += 25;
            if (xOffset > canvas.width - 20) {
                xOffset = 0;
                yOffset += 25;
            }
        }

        // Draw rods
        for (let i = 0; i < baseComponents.rods; i++) {
            ctx.fillStyle = 'green';
            ctx.fillRect(xOffset, yOffset, 20 * base, 20);
            for (let j = 0; j < base; j++) {
                ctx.strokeStyle = 'black';
                ctx.strokeRect(xOffset + j * 20, yOffset, 20, 20);
            }
            xOffset += 20 * base + 5;
            if (xOffset > canvas.width - 20 * base) {
                xOffset = 0;
                yOffset += 25;
            }
        }

        // Draw flats
        for (let i = 0; i < baseComponents.flats; i++) {
            ctx.fillStyle = 'yellow';
            ctx.fillRect(xOffset, yOffset, 20 * base, 20 * base);
            for (let j = 0; j < base; j++) {
                for (let k = 0; k < base; k++) {
                    ctx.strokeStyle = 'black';
                    ctx.strokeRect(xOffset + j * 20, yOffset + k * 20, 20, 20);
                }
            }
            xOffset += 20 * base + 5;
            if (xOffset > canvas.width - 20 * base) {
                xOffset = 0;
                yOffset += 20 * base + 5;
            }
        }

        // Draw 3D cubes
        for (let i = 0; i < baseComponents.cubes3D; i++) {
            ctx.fillStyle = 'red';
            const cubeSize = 20 * base;
            const depth = cubeSize / 3;

            // Draw front face
            ctx.fillRect(xOffset, yOffset, cubeSize, cubeSize);
            ctx.strokeStyle = 'black';
            for (let j = 0; j < base; j++) {
                for (let k = 0; k < base; k++) {
                    ctx.strokeRect(xOffset + j * 20, yOffset + k * 20, 20, 20);
                }
            }

            // Draw top face
            ctx.beginPath();
            ctx.moveTo(xOffset, yOffset);
            ctx.lineTo(xOffset + depth, yOffset - depth);
            ctx.lineTo(xOffset + cubeSize + depth, yOffset - depth);
            ctx.lineTo(xOffset + cubeSize, yOffset);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.fill();
            ctx.stroke();

            // Draw right face
            ctx.beginPath();
            ctx.moveTo(xOffset + cubeSize, yOffset);
            ctx.lineTo(xOffset + cubeSize + depth, yOffset - depth);
            ctx.lineTo(xOffset + cubeSize + depth, yOffset + cubeSize - depth);
            ctx.lineTo(xOffset + cubeSize, yOffset + cubeSize);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
            ctx.fill();
            ctx.stroke();

            xOffset += cubeSize + depth + 5;
            if (xOffset > canvas.width - cubeSize) {
                xOffset = 0;
                yOffset += cubeSize + depth + 5;
            }
        }
    };

    const decomposeCubes = () => {
        cubes.forEach(cube => {
            cube.x = Math.random() * (canvas.width - 20);
            cube.y = Math.random() * (canvas.height - 20);
        });
        drawCubes();
        selectedUnits = 0;
        selectedUnitsDisplay.textContent = `Selected Units: ${selectedUnits}`;
        baseConversionDisplay.textContent = '';
        baseTenCountDisplay.textContent = '';
    };

    const addCube = () => {
        cubes.push({
            x: Math.random() * (canvas.width - 20),
            y: Math.random() * (canvas.height - 20),
            size: 20,
        });
        drawCubes();
    };

    const removeCube = () => {
        if (cubes.length > 0) {
            cubes.pop();
            drawCubes();
        }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('mousemove', handleDrag);
    canvas.addEventListener('mouseup', handleDragEnd);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleDragEnd);

    composeButton.addEventListener('click', updateBaseConversion);
    decomposeButton.addEventListener('click', decomposeCubes);
    addCubeButton.addEventListener('click', addCube);
    removeCubeButton.addEventListener('click', removeCube);

    generateRandomCubes();
});
