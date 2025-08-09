//Copyright (C) 2025 Guillaume P. Hérault (https://github.com/LucasNTT/LucasNTT.github.io)
//
//Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal
//in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following condition:
//
//The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
function Canvas() {
	this.gridWidth = 50;
	this.gridHeight = 50;
    
    this.marginTop = 10;
    this.marginBottom = this.gridHeight;
    this.marginLeft = 5;
	this.marginRight = this.gridWidth;
    
    paper.install(window);
}

Canvas.prototype.reInit = function () {
	this.canvasWidth = 0; // the number of grid cells
	this.canvasHeight = 1;
	this.animations = [];
    this.animations = [];
    boxes = [];
    boxes[0] = [];
}

Canvas.prototype.setup = function(suffix) {
    var viewWidth = this.canvasWidth * this.gridWidth + this.marginLeft + this.marginRight;
    var viewHeight = this.canvasHeight * this.gridHeight + this.marginTop + this.marginBottom;

    var scrollSize = 50;
    var clientWidth, clientHeight;
	var rect = document.getElementById('measure' + suffix).getBoundingClientRect();
	var w = rect.right - rect.left;

    clientWidth = w - scrollSize;
    clientHeight = (rect.right - rect.left) * viewHeight / viewWidth;
    document.getElementById('myCanvas' + suffix).width = clientWidth + 5;
    document.getElementById('myCanvas' + suffix).height = clientHeight + 5;
    
    paper.setup('myCanvas' + suffix);

    view.zoom = clientWidth / viewWidth; 
    this.offsetX = 2 * this.marginLeft / view.zoom + (clientWidth - viewWidth) >> 1;
    this.offsetY = 2 * this.marginTop / view.zoom + (clientHeight - viewHeight) >> 1;
}

Canvas.prototype.registerAnimation = function (params) {
    this.animations[this.animations.length] = params;
}

Canvas.prototype.eventHandlers = function() {
	this.tool = new Tool();
    var self = this;
	this.tool.onMouseMove = function(event) {
		for (var i = 0; i < self.animations.length; i++) {
			if (event.item == self.animations[i].item) {
				if (!self.animations[i].active) {
					self.animations[i].active = true;
					self.animations[i].running = true;
				}
			} else {
				if (self.animations[i].active) {
					self.animations[i].active = false;
					self.animations[i].running = true;
				}
			}
		}
    }
    view.onFrame = function(event) {
        for (var i = 0; i < self.animations.length; i++) {
            if (self.animations[i].running) {
                if (self.animations[i].active)
                    self.animations[i].running = self.animations[i].onFrameIn(0);
                else
                    self.animations[i].running = self.animations[i].onFrameOut(0);
            }
        }
    }
}

Canvas.prototype.getColor = function (colorSet, colorStrength) {
    switch (colorSet) {
        case -1: return new Color((172 - 25 * colorStrength) / 255, (193 - 20 * colorStrength) / 255, 15 / 255); // non-FFT step
        case 0: { // FFT steps
            if (0 == colorStrength) return new Color(226 / 255, 231 / 255, 220 / 255);
            if (1 == colorStrength) return new Color(202 / 255, 211 / 255, 190 / 255);
            if (2 == colorStrength) return new Color(175 / 255, 190 / 255, 158 / 255);
            if (3 == colorStrength) return new Color(157 / 255, 176 / 255, 136 / 255);
            if (4 == colorStrength) return new Color(138 / 255, 160 / 255, 113 / 255);
            if (5 == colorStrength) return new Color(97 / 255, 115 / 255, 77 / 255);
        }
        default: { // values & butterflies
            var j, k;
            if (params.colored) {
                k = 1 + (colorSet % 7); // from 1 to 7, that makes 3 bits that determine the RGB components
                j = 1 + Math.trunc(colorSet / 7);
            }
            else {
                k = 7;
                colorStrength = colorStrength + 30;
            }
            // Red Green Blue components
            var r = 1 == (k & 1) ? colorStrength / 255 : 1 / j;
            var g = 2 == (k & 2) ? colorStrength / 255 : 1 / j;
            var b = 4 == (k & 4) ? colorStrength / 255 : 1 / j;
            return new Color(r, g, b);
        }
    }
}

Canvas.prototype.changeColor = function(step, index, colorSet, colorStrength) {
    boxes[step][index].fillColor = this.getColor(colorSet, colorStrength);
}

Canvas.prototype.drawGrid = function () {
    for (var x = 0; x <= this.canvasWidth; x++) {
        for (var y = 0; y <= this.canvasHeight; y++) {
            var left = this.offsetX + x * this.gridWidth;
            var top = this.offsetY + y * this.gridHeight;
            var path = new Path.Circle(new Point(left, top), 5);
            path.fillColor = '#e9e9ef';	
        }
    }
}

Canvas.prototype.addBox = function (param) {
	// expected properties in param : X, Y, W, H, value, colorSet, colorStrength
	var x = param.X * this.gridWidth;
	var y = param.Y * this.gridHeight;
	var rectangle = new Rectangle(new Point(x + this.offsetX,
		y + this.offsetY),
		new Point(x + this.offsetX + param.W * this.gridWidth,
			y + this.offsetY + param.H * this.gridHeight));
	var group = new Group();
    var path = new Path.Rectangle(rectangle);
    path.rectangle = rectangle; // extra-property
	group.addChild(path);

    path.fillColor = this.getColor(param.colorSet, param.colorStrength);
	path.strokeColor = 'black';
	path.shadowColor = 'black';
	path.shadowBlur = 1;
	group.children[0].shadowOffset = new Point(1, 1);

	if (typeof (param.value) != "undefined") {
		var text = new PointText(new Point(rectangle.center.x, rectangle.center.y + 9));
		text.fillColor = 'black';
		text.content = param.value.toString();
		text.fontFamily = '"Lucida Console", Monaco, monospace';
		text.fontSize = 24;
		text.justification = 'center';
		if (text.bounds.width > rectangle.width - 16) {
            text.bounds = new Rectangle(rectangle.x + 8, text.bounds.y, rectangle.width - 16, text.bounds.height);
		}
		group.addChild(text);
        if (isNaN(text.content)) {
			text.fontFamily = '"Computer Modern Serif Upright Italic"';
			text.fontWeight = 'Italic';
			text.fontSize = 32;
			if (text.content.indexOf('^') != -1) {
				var split = text.content.split("^");
				text.content = split[0];
				var text_exp = new PointText(new Point(text.bounds.x + text.bounds.width + 2, rectangle.center.y + 1));
				text_exp.fillColor = 'black';
				text_exp.content = split[1];
				text_exp.fontSize = 22;
				text_exp.fontFamily = '"Computer Modern Serif Upright Italic"';
				text_exp.fontWeight = 'Italic';
				group.addChild(text_exp);
			}
		}
	}
	return group;
}

Canvas.prototype.addValue = function (param) {
	// expected properties in param : X, Y, W, H, value, step, index (+optionaly tooltip)
    // Draw the box
    var group = this.addBox(param);
    // Then store the path of the newly created box
    if (boxes.length <= param.step) {
        boxes[param.step] = [];
    }
    boxes[param.step][param.index] = group.children[0];
    var self = this;
    this.registerAnimation({
        type: 'mousemove',
        item: group,
        onFrameIn: function (frame) {
            if (param.tooltip && !group.toolTip) {
                if (param.index == 0) {
                    group.toolTip = self.drawTooltip(param.X + 4, param.Y - 1, 5, 3, param.tooltip, true);
                } else {
                    group.toolTip = self.drawTooltip(param.X - 6, param.Y - 1, 5, 3, param.tooltip, false);
                }
            }
            return false;
        },
        onFrameOut: function (frame) {
            if (group.toolTip) {
                group.toolTip.remove();
                group.toolTip = undefined;
            }
            return false;
        }
    });
}

Canvas.prototype.addButterfly = function (param) {
	// expected properties in param : X, Y, W, H, value, DIF, exp, step, in, out
    var group = this.addBox(param);
    group.children[1].opacity = 0.5;

    var offsety = -56; // above (DIT)
    if (param.DIF) {
        offsety = 30; // below (DIF)
    }
    var rectangle = group.children[0].rectangle; // retrieve extra-property
    var text = new PointText(new Point(rectangle.center.x + 35, rectangle.y + rectangle.height + offsety));
    text.fillColor = '#202020';
    text.fontFamily = '"Computer Modern Serif Upright Italic"';
    text.fontWeight = 'Italic';
    text.content = 'w';
    text.fontSize = 32;
    text.justification = 'center';
    group.addChild(text);
    var text = new PointText(new Point(rectangle.center.x + 48, rectangle.y + rectangle.height + offsety - 9));
    text.fillColor = '#202020';
    text.fontFamily = '"Computer Modern Serif Upright Italic"';
    text.fontWeight = 'Italic';
    text.content = param.exp;
    text.fontSize = 22;
    group.addChild(text);

    var self = this;
    this.registerAnimation({
        type: 'mousemove',
        item: group,
        onFrameIn: function (frame) {
            var again = false;
            var x = group.children[0].shadowBlur;
            if (x < 20) {
                group.children[0].shadowBlur = x + 1;
                group.children[0].shadowOffset = new Point(x / 2, x / 2);
                for (var i = 0; i < param.in.length; i++) {
                    var path = boxes[param.step][param.in[i]];
                    path.shadowBlur = x + 1;
                    path.shadowOffset = new Point(x / 2, x / 2);
                }
                for (var i = 0; i < param.out.length; i++) {
                    var path = boxes[param.step + 1][param.out[i]];
                    path.shadowBlur = x + 1;
                    path.shadowOffset = new Point(x / 2, x / 2);
                }
                again = true;
            }
            if (group.children.length >= 2) {
                if (group.children[1].opacity < 1) {
                    group.children[1].opacity += 0.025;
                    again = true;
                }
            }
            return again;
        },
        onFrameOut: function (frame) {
            var again = false;
            var x = group.children[0].shadowBlur;
            if (x > 1) {
                group.children[0].shadowBlur = x - 1;
                group.children[0].shadowOffset = new Point(x / 2, x / 2);
                for (var i = 0; i < param.in.length; i++) {
                    var path = boxes[param.step][param.in[i]];
                    path.shadowBlur = x - 1;
                    path.shadowOffset = new Point(x / 2, x / 2);
                }
                for (var i = 0; i < param.out.length; i++) {
                    var path = boxes[param.step + 1][param.out[i]];
                    path.shadowBlur = x - 1;
                    path.shadowOffset = new Point(x / 2, x / 2);
                }
                again = true;
            }
            if (group.children.length >= 2) {
                if (group.children[1].opacity > 0.5) {
                    group.children[1].opacity -= 0.025;
                    again = true;
                }
            }
            return again;
        }
    });
}

Canvas.prototype.addArrow = function (param) {
    // expected properties in param : X1, Y1, X2, Y2 and optionally exp
	var x1 = param.X1 * this.gridWidth + this.offsetX;
	var y1 = param.Y1 * this.gridHeight + this.offsetY;
	var x2 = param.X2 * this.gridWidth + this.offsetX;
	var y2 = param.Y2 * this.gridHeight + this.offsetY;
	var path = new Path();
	path.strokeColor = '#404040'; // dark gray
	path.add(new Point(x1, y1));
    path.add(new Point(x2, y2));
    if (typeof (param.exp) != "undefined") {
        this.drawLatexText(x2 + 4, y1 + 60, 'w^{' + param.exp.toString() + '}', 32, undefined, 9999);
    }
}

Canvas.prototype.addArrowStep = function(param) {
    // expected properties in param : X, Y, W, H, isFirstDiagram, colorSet, colorStrength, title, description
	var x = param.X * this.gridWidth + this.offsetX;
	var y = param.Y * this.gridHeight + this.offsetY;
    var h = this.gridHeight - 10;
    var group = new Group();
    var path = new Path();
    group.addChild(path);
    path.fillColor = this.getColor(param.colorSet, param.colorStrength);	
	path.strokeWidth = 1;
    path.strokeColor = path.fillColor;
    if (param.isFirstDiagram) {
        path.add(new Point(x, y));
        path.add(new Point(x + param.W * this.gridWidth, y));
    } else {
        path.add(new Point(x, y - h));
        path.add(new Point(x + ((param.W * this.gridWidth) >> 1), y));
        path.add(new Point(x + param.W * this.gridWidth, y - h));
    }
    path.add(new Point(x + param.W * this.gridWidth, y + (param.H - 1) * this.gridHeight));
    path.add(new Point(x + ((param.W * this.gridWidth) >> 1), y + (param.H - 1) * this.gridHeight + h));
    path.add(new Point(x, y + (param.H - 1) * this.gridHeight));
    path.closed = true;
    path.shadowColor = 'black';
    path.shadowBlur = 1;
    group.children[0].shadowOffset = new Point(1, 1);
    
    if (typeof(param.title) != "undefined") {
        var text = new PointText(new Point(x + ((param.W * this.gridWidth) >> 1), y + h));
		text.fillColor = 'black';
		text.content = param.title;
		text.fontSize = 24;
		text.justification = 'center';
        group.addChild(text);
    }
    
    if (typeof(param.subtitle) != "undefined") {
        var text = new PointText(new Point(x + ((param.W * this.gridWidth) >> 1), y + h + this.gridHeight));
		text.fillColor = 'black';
		text.content = param.subtitle;
		text.fontSize = 20;
		text.justification = 'center';
		if (text.bounds.width > param.W * this.gridWidth) {
			text.bounds = new Rectangle(x + 2, text.bounds.y, param.W * this.gridWidth - 4, text.bounds.height);
		}
        group.addChild(text);
    }
    
    if (typeof(param.description) != "undefined") {
        var text = new PointText(new Point(x + 18, y + h + 2 * this.gridHeight));
        text.fillColor = 'black';	
		text.content = param.description;
		text.fontSize = 20;
        text.opacity = 0.5;
        group.addChild(text);
    }
    
    var self = this;
    this.registerAnimation({
        type : 'mousemove',
        item: group,
        onFrameIn: function(frame) {
            var x = group.children[0].shadowBlur;
            var again = false;
            if (x < 12) {
                group.children[0].shadowBlur = x + 1;
                group.children[0].shadowOffset = new Point(x / 2, x / 2);
                again = true;
            } else {
				if (param.tooltip && !group.toolTip) {
                    group.toolTip = self.drawTooltip(param.X + 4, param.Y + 1, 5, 3, param.tooltip, true);
				}
			}
            if (group.children.length == 3) {
                if (group.children[2].opacity < 1) {
                    group.children[2].opacity += 0.025;
                    again = true;
                }
			}
            return again;
        },
        onFrameOut: function(frame) {
            var x = group.children[0].shadowBlur;
            var again = false;
            if (x > 1) {
                group.children[0].shadowBlur = x - 1;
                group.children[0].shadowOffset = new Point(x / 2, x / 2);
                again = true;
            }
            if (group.children.length == 3) {
                if (group.children[2].opacity > 0.5) {
                    group.children[2].opacity -= 0.025;
                    again = true;
                }
            }
            if (group.toolTip) {
                group.toolTip.remove();
                group.toolTip = undefined;
            }
            return again;
        }
    });
}

Canvas.prototype.pointToGrid = function(point) {
	// from a point in project coordinates, it returns the grid coordinates
	return new Point(Math.floor((point.x - this.offsetX) / this.gridWidth), Math.floor((point.y - this.offsetY) / this.gridHeight));
}

Canvas.prototype.drawTooltip = function (X, Y, W, H, value, left) {
    var offset = 65;
    if (Y == -1) {
        Y = 0;
        offset = 20;
    }
    var x = X * this.gridWidth + this.offsetX;
    var y = Y * this.gridHeight + this.offsetY - 10;
    var group = new Group();
    var rectangle = new Rectangle(new Point(x, y), new Point(x + W * this.gridWidth, y + H * this.gridHeight)); 
    var path = new Path.Rectangle(rectangle, 10);
    group.addChild(path);
    path.fillColor = '#f1f179';
    path.strokeColor = '#e6e617';
    path.strokeWidth = 4;
    if (left) {
        path.insert(2, new Point(x, y + offset + 30));
        path.insert(3, new Point(x - 30, y + offset + 15));
        path.insert(4, new Point(x, y + offset));
    }
    else {
        path.insert(6, new Point(x + W * this.gridWidth, y + offset));
        path.insert(7, new Point(x + W * this.gridWidth + 30, y + offset + 15));
        path.insert(8, new Point(x + W * this.gridWidth, y + offset +30));
    }
    path.shadowColor = 'black';
    path.shadowBlur = 12;
    path.shadowOffset = new Point(5, 5);
    var maxY = x + W * this.gridWidth - 20;
    if (!Array.isArray(value)) {
        var text = new PointText(new Point(x + 18, y + 28));
        text.fontSize = 18;
        text.content = value;
        if (x + 18 + text.bounds.width > maxY) {
            text.bounds = new Rectangle(x + 18, text.bounds.y, maxY - x - 18, text.bounds.height);
        }
        group.addChild(text);
    } else {
        var lineHeight = 21;
        var startY = (value.length <= 2) ? y + 28 + (3 - value.length) * lineHeight : y + 28;
        this.drawLatexText(x + 18, startY, value[0].value, 28, group, x + W * this.gridWidth - 10);
        startY += (value.length == 6) ? 8 : 8 + lineHeight;
        for (var i = 1; i < value.length; i++) {
            this.drawLatexText(x + 18, startY + i * lineHeight, value[i].key + ' = ' + value[i].value, 22, group, maxY);
        }
    }
    group.opacity = 1;
    return group;
}

Canvas.prototype.drawLatexText = function (x, y, value, fontSize, group, maxY) {
    var parts = [];
    parts.push(
        {
            value: '',
            exp: 0
        });
    var parenthesis = false;
    for (var i = 0; i < value.length; i++) {
        switch (value.charAt(i)) {
            case '^':
                parts.push(
                    {
                        value: '',
                        exp: 1
                    });
                break;
            case '_':
                parts.push(
                    {
                        value: '',
                        exp: -1
                    });
                break;
            case '{':
                parenthesis = true;
                break;
            case '}':
                parenthesis = false;
                parts.push(
                    {
                        value: '',
                        exp: 0
                    });
                break;
            default:
                parts[parts.length - 1].value += value.charAt(i);
                if (parts[parts.length - 1].exp != 0 && !parenthesis) {
                    parts.push(
                        {
                            value: '',
                            exp: 0
                        });
                }
                break;
        }
    }

    var pos = x;
    var top;
    for (var i = 0; i < parts.length; i++) {
        switch (parts[i].exp) {
            case  1: top = y - 9; break;
            case -1: top = y + 9; break;
            default: top = y; break;
        }
        var text = new PointText(new Point(pos, top));
        text.fontFamily = '"Computer Modern Serif Upright Italic"';
        text.fontWeight = 'Italic';
        text.fontSize = fontSize;
        if (parts[i].exp != 0) {
            text.fontSize = fontSize - 10;
        }
        text.content = parts[i].value;
        if (pos + text.bounds.width > maxY) {
            text.bounds = new Rectangle(pos, text.bounds.y, maxY - pos, text.bounds.height);
        }
        if (group !== undefined) {
            group.addChild(text);
        }
        pos += text.bounds.width;
    }
}