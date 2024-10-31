import './base-slider.control.css';

/**
 * base slider control
 */
class BaseSliderControl{

    /**
     * control type defined in data-jplist-control attribute;
     * for example, data-jplist-control="hidden-sort" has type='hidden-sort'
     * @param {HTMLElement} element
     * @param {boolean} isVertical
     * @param {number} min
     * @param {number} value1 - initial value 1
     * @param {number} value2 - initial value2
     * @param {number} max
     * @param {Function} callback
     */
    constructor(element, isVertical = false, min = 0, value1 = 0, value2 = 0, max = 0, step = 1, valInput1 = null, valInput2 = null, callback = (value1, value2) => {}){

        if(element) {

            this.element = element;
            this.element.classList.add('jplist-slider');

            if(!this.element) return;

            this.isVertical = isVertical;
            this.callback = callback;
            this.min = min;
            this.max = max;
            this.step = step;

            // Set default values if not provided
            if (value1 === 0) value1 = this.min;
            if (value2 === 0) value2 = this.max;

            if(isVertical){
                this.element.classList.add('jplist-slider-vertical');
            }

            //create and append the first holder
            this.handler1 = document.createElement('span');
            this.handler1.classList.add('jplist-slider-holder-1');
            this.element.appendChild(this.handler1);

            //create and append the range element
            this.range = document.createElement('span');
            this.range.classList.add('jplist-slider-range');
            this.element.appendChild(this.range);

            //create and append the second holder
            this.handler2 = document.createElement('span');
            this.handler2.classList.add('jplist-slider-holder-2');
            this.element.appendChild(this.handler2);

            // Initialize handlers with proper values
            const initialPos1 = this.getInnerValue(value1, this.min, this.max);
            const initialPos2 = this.getInnerValue(value2, this.min, this.max);
            this.handler2.top = 0;
            const lefttop = this.isVertical ? 'top' : 'left';
            
            // Set initial positions
            this.handler1.style[lefttop] = initialPos1 + '%';
            this.handler2.style[lefttop] = initialPos2 + '%';
            this.valueInput1 = valInput1;
            // Set initial range
            this.range.style[lefttop] = initialPos1 + '%';
            this.range.style[this.isVertical ? 'height' : 'width'] = (initialPos2 - initialPos1) + '%';

            // Set initial values
            this.handler1.value = value1;
            this.handler2.value = value2;

            this.dragging = null;

            //slider input control
            this.valueInput1 = valInput1;
            this.valueInput2 = valInput2;

            // Initialize value display elements
            this.val1Elements = element.querySelectorAll('[data-type="value-1"]');
            this.val2Elements = element.querySelectorAll('[data-type="value-2"]');

            this.handler1.addEventListener('mousedown', this.start.bind(this));
            this.handler2.addEventListener('mousedown', this.start.bind(this));
            this.handler1.addEventListener('touchstart', this.start.bind(this));
            this.handler2.addEventListener('touchstart', this.start.bind(this));

            document.addEventListener('mousemove', this.render.bind(this));
            document.addEventListener('touchmove', this.render.bind(this));
            //window.addEventListener('resize', this.resize.bind(this));

            document.addEventListener('mouseup', this.stop.bind(this));
            document.addEventListener('touchend', this.stop.bind(this));
            document.body.addEventListener('mouseleave', this.stop.bind(this));

            this.element.addEventListener('mousedown', this.jump.bind(this));

            //slider input control jump
            if (valInput1 && valInput2) {
                this.valueInput1.addEventListener('keydown', this.inputJump.bind(this));
                this.valueInput2.addEventListener('keydown', this.inputJump.bind(this));
            }

            //set initial values
            this.setValues(value1, value2);

            // Ensure min/max labels are applied on initialization
            const minLabel = this.element.parentElement.getAttribute('data-min-label');
            const maxLabel = this.element.parentElement.getAttribute('data-max-label');
            
            if (value1 === min && minLabel) {
                this.element.parentElement.querySelectorAll('[data-type="value-1"]').forEach(el => {
                    el.textContent = minLabel;
                });
            }
            
            if (value2 === max && maxLabel) {
                this.element.parentElement.querySelectorAll('[data-type="value-2"]').forEach(el => {
                    el.textContent = maxLabel;
                });
            }
        }
    }

    /**
     * set slider values from outside
     * @param {number} value1
     * @param {number} value2
     * @param {boolean} sendCallback
     */
    setValues(value1, value2, sendCallback = true){

        if(value2 < value1){
            value2 = value1;
        }

        // Add or remove applied class based on new values
        if (value1 === this.min && value2 === this.max) {
            this.element.classList.remove('jplist-slider-applied');
        } else {
            this.element.classList.add('jplist-slider-applied');
        }

        const pos1 = this.getInnerValue(value1, this.min, this.max);
        const pos2 = this.getInnerValue(value2, this.min, this.max);

        // Update handlers and range directly with percentages
        const lefttop = this.isVertical ? 'top' : 'left';
        
        this.handler1.style[lefttop] = pos1 + '%';
        this.handler2.style[lefttop] = pos2 + '%';
        
        this.range.style[lefttop] = pos1 + '%';
        this.range.style[this.isVertical ? 'height' : 'width'] = (pos2 - pos1) + '%';

        // Update values
        this.handler1.value = value1;
        this.handler2.value = value2;

        // Update display elements
        const minLabel = this.element.parentElement.getAttribute('data-min-label');
        const maxLabel = this.element.parentElement.getAttribute('data-max-label');
        
        this.element.parentElement.querySelectorAll('[data-type="value-1"]').forEach(el => {
            el.textContent = (value1 === this.min && minLabel) ? minLabel : Math.round(value1);
        });
        
        this.element.parentElement.querySelectorAll('[data-type="value-2"]').forEach(el => {
            el.textContent = (value2 === this.max && maxLabel) ? maxLabel : Math.round(value2);
        });

        // Call callback if needed
        if(this.callback && sendCallback) {
            this.callback(value1, value2);
        }
    }

    /**
     * convert actual value to percentage
     * @param {number} value
     * @param {number} min
     * @param {number} max
     * @return {number} percentage
     */
    getInnerValue(value, min, max) {
        if (max === min) return 0;
        return ((value - min) / (max - min)) * 100;
    }

    /**
     * convert percentage to actual value
     * @param {number} percentage
     * @param {number} min
     * @param {number} max
     * @return {number} value
     */
    getPreviewValue(percentage, min, max) {
        return Math.round(((max - min) * (percentage / 100)) + min);
    }

    /**
     * jump to the specified point on the slider
     * @param {Object} e
     */
    jump(e){
        e.preventDefault();

        let position = this.getHandlerPos(e);

        if(this.isVertical){
            this.dragging = Math.abs(position.y - this.handler1.top) < Math.abs(position.y - this.handler2.top) ? this.handler1 : this.handler2;
        }
        else{
            this.dragging = Math.abs(position.x - this.handler1.left) < Math.abs(position.x - this.handler2.left) ? this.handler1 : this.handler2;
        }

        //render the updated state
        this.render(e);
    }

    /**
     * jump to the specified point on the slider with input
     * @param {Object} e
     */
    inputJump(e) {

        if (e.which === 13) {

            let value1 = this.valueInput1.value ? this.valueInput1.value : this.handler1.value;
            let value2 = this.valueInput2.value ? this.valueInput2.value : this.handler2.value;

            if (this.valueInput1.value > this.handler2.value) {
                value1 = this.valueInput1.value = this.handler2.value;
            }
            if (this.valueInput2.value < this.handler1.value) {
                value2 = this.valueInput2.value = this.handler1.value;
            }
            
            //convert value to position
            const pos1 = this.getInnerValue(value1, this.min, this.max);
            const pos2 = this.getInnerValue(value2, this.min, this.max);

            this.update({
                x: pos2,
                y: pos2
            }, this.handler2, true);

            this.update({
                x: pos1,
                y: pos1
            }, this.handler1, true);
        }
    }

    /**
     * update z-index of the active handler
     */
    setZIndex(){

        const handler1ZIndex = window.getComputedStyle ? Number(document.defaultView.getComputedStyle(this.handler1, null).getPropertyValue('z-index')) || 200 : 200;
        const handler2ZIndex = window.getComputedStyle ? Number(document.defaultView.getComputedStyle(this.handler2, null).getPropertyValue('z-index')) || 200 : 200;

        if(handler1ZIndex === handler2ZIndex){
            this.dragging.style['z-index'] = handler1ZIndex + 1;
        }
        else{
            const max = Math.max(handler1ZIndex, handler2ZIndex);
            const min = Math.min(handler1ZIndex, handler2ZIndex);

            this.handler1.style['z-index'] = min;
            this.handler2.style['z-index'] = min;
            this.dragging.style['z-index'] = max;
        }
    }

    /**
     * start dragging
     * @param {Object} e
     */
    start(e){
        e.preventDefault();
        e.stopPropagation();

        this.dragging = e.target;

        //update z-index of the active handler
        this.setZIndex();

        //render the updated state
        this.render();
    }

    /**
     * stop dragging
     * @param {Object} e
     */
    stop(e){
        //e.preventDefault();
        
        if (this.dragging) {
            
            // Apply the filter when dragging stops
            if(this.callback){
                this.callback(this.handler1.value, this.handler2.value);
            }
            this.dragging = null;
        }
    }

    /**
     * render the updated state
     */
    render(e){
        if(e && this.dragging){
            // Update the position and internal values
            this.update(this.getHandlerPos(e), this.dragging, false);
            
            const value1 = Math.round(this.handler1.value);
            const value2 = Math.round(this.handler2.value);
            
            // Update value display elements within this slider only
            const minLabel = this.element.parentElement.getAttribute('data-min-label');
            const maxLabel = this.element.parentElement.getAttribute('data-max-label');
            
            this.element.parentElement.querySelectorAll('[data-type="value-1"]').forEach(el => {
                el.textContent = (value1 === this.min && minLabel) ? minLabel : value1;
            });
            
            this.element.parentElement.querySelectorAll('[data-type="value-2"]').forEach(el => {
                el.textContent = (value2 === this.max && maxLabel) ? maxLabel : value2;
            });

            // Update input values if they exist
            if (this.valueInput1) {
                this.valueInput1.value = value1;
            }
            if (this.valueInput2) {
                this.valueInput2.value = value2;
            }
        }
    }

    /**
     * update position and styles
     * @param {object} position
     * @param {element} handler
     * @param {boolean} sendCallback
     */
    update(position, handler, sendCallback = true){
        if(handler){
            const rect = this.element.getBoundingClientRect();
            
            // Convert position to percentage
            const percentage = this.isVertical ? 
                (position.y / rect.height) * 100 : 
                (position.x / rect.width) * 100;

            // Clamp percentage between 0 and 100
            let clampedPercentage = Math.max(0, Math.min(100, percentage));

            // Handle constraints between handlers
            if(handler === this.handler1 && parseFloat(this.handler2.style[this.isVertical ? 'top' : 'left']) <= clampedPercentage){
                clampedPercentage = parseFloat(this.handler2.style[this.isVertical ? 'top' : 'left']);
            }

            if(handler === this.handler2 && parseFloat(this.handler1.style[this.isVertical ? 'top' : 'left']) >= clampedPercentage){
                clampedPercentage = parseFloat(this.handler1.style[this.isVertical ? 'top' : 'left']);
            }

            // Save current value
            const lefttop = this.isVertical ? 'top' : 'left';
            handler[lefttop] = clampedPercentage;
            handler.value = this.getPreviewValue(clampedPercentage, this.min, this.max);

            // Handle step constraints
            if (this.step > 1) {
                const stepValue = Math.ceil(handler.value / this.step) * this.step;
                handler.value = stepValue > this.max ? this.max : stepValue;
                clampedPercentage = this.getInnerValue(handler.value, this.min, this.max);
            }

            // Update handler position with percentage
            handler.style[lefttop] = clampedPercentage + '%';

            // Update range element
            const rangeStart = parseFloat(this.handler1.style[lefttop]);
            const rangeEnd = parseFloat(this.handler2.style[lefttop]);
            this.range.style[lefttop] = rangeStart + '%';
            this.range.style[this.isVertical ? 'height' : 'width'] = (rangeEnd - rangeStart) + '%';

            // Update input values if they exist
            if (this.valueInput1 && this.valueInput2) {
                if (handler === this.handler1) {
                    this.valueInput1.value = Math.round(handler.value);
                } else {
                    this.valueInput2.value = Math.round(handler.value);
                }
            }

            // Update value display elements
            const value1 = Math.round(this.handler1.value);
            const value2 = Math.round(this.handler2.value);
            const minLabel = this.element.parentElement.getAttribute('data-min-label');
            const maxLabel = this.element.parentElement.getAttribute('data-max-label');
            
            this.element.parentElement.querySelectorAll('[data-type="value-1"]').forEach(el => {
                el.textContent = (value1 === this.min && minLabel) ? minLabel : value1;
            });
            
            this.element.parentElement.querySelectorAll('[data-type="value-2"]').forEach(el => {
                el.textContent = (value2 === this.max && maxLabel) ? maxLabel : value2;
            });

            // Call callback function only if not dragging or if explicitly requested via sendCallback
            if(this.callback && (sendCallback && !this.dragging)){
                this.callback(this.handler1.value, this.handler2.value);
            }

            // Add or remove applied class based on slider state
            if (this.isInitialState()) {
                this.element.classList.remove('jplist-slider-applied');
            } else {
                this.element.classList.add('jplist-slider-applied');
            }
        }
    }

    /**
     * check if slider is in its initial state
     * @return {boolean}
     */
    isInitialState() {
        return Math.round(this.handler1.value) === this.min && Math.round(this.handler2.value) === this.max;
    }

    /**
     * get handler position from mouse / tap position
     * @param {object} e
     * @return {object} handler position
     */
    getHandlerPos(e){
        const rect = this.element.getBoundingClientRect();
        const point = {
            x: e.touches && e.touches.length > 0 ? e.touches[0].pageX : e.clientX,
            y: e.touches && e.touches.length > 0 ? e.touches[0].pageY : e.clientY
        };

        return {
            x: point.x - rect.left,
            y: point.y - rect.top
        };
    }

}

export default BaseSliderControl;