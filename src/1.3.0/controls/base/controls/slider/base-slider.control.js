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

            //initial value
            this.handler1.left = 0;
            this.handler1.top = 0;
            this.handler1.value = this.getPreviewValue(0, min, max); //0

            //create and append the second holder
            this.handler2 = document.createElement('span');
            this.handler2.classList.add('jplist-slider-holder-2');
            this.element.appendChild(this.handler2);

            //initial value
            this.handler2.left = 0;
            this.handler2.top = 0;
            this.handler2.value = this.getPreviewValue(0, min, max); //0

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
            window.addEventListener('resize', this.resize.bind(this));

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

        // Update value display elements
        const minLabel = this.element.parentElement.getAttribute('data-min-label');
        const maxLabel = this.element.parentElement.getAttribute('data-max-label');
        
        this.element.parentElement.querySelectorAll('[data-type="value-1"]').forEach(el => {
            el.textContent = (value1 === this.min && minLabel) ? minLabel : Math.round(value1);
        });
        
        this.element.parentElement.querySelectorAll('[data-type="value-2"]').forEach(el => {
            el.textContent = (value2 === this.max && maxLabel) ? maxLabel : Math.round(value2);
        });

        this.update({
            x: pos2,
            y: pos2
        }, this.handler2, sendCallback);

        this.update({
            x: pos1,
            y: pos1
        }, this.handler1, sendCallback);
    }

    /**
     * convert [0, slider-width] range to [min, max] range for the specified value
     * @param {number} value
     * @param {number} min
     * @param {number} max
     * @return {number} mappedValue
     */
    getPreviewValue(value, min, max){

        const rect = this.element.getBoundingClientRect();
        const size = this.isVertical? 'height': 'width';

        const newStart = min;
        const newEnd = max;
        const originalStart = 0;
        const originalEnd = rect[size];

        //return Math.round((newEnd - newStart) * ((value - originalStart) / (originalEnd - originalStart)) + newStart);
        return Math.trunc((newEnd - newStart) * ((value - originalStart) / (originalEnd - originalStart)) + newStart);
    }

    /**
     * convert [min, max] range to [0, slider-width] range for the specified value
     * @param {number} value
     * @param {number} min
     * @param {number} max
     * @return {number} mappedValue
     */
    getInnerValue(value, min, max){

        const rect = this.element.getBoundingClientRect();
        const size = this.isVertical? 'height': 'width';

        const newStart = 0;
        const newEnd = rect[size];
        const originalStart = min;
        const originalEnd = max;

        //return Math.round((newEnd - newStart) * ((value - originalStart) / (originalEnd - originalStart)) + newStart);
        return (newEnd - newStart) * ((value - originalStart) / (originalEnd - originalStart)) + newStart;
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
     * on window resize
     * @param {Object} e
     */
    resize(e){

        if(this.handler1 && this.handler2){

            this.setValues(this.handler1.value, this.handler2.value);
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

            const size = this.isVertical? 'height': 'width';
            const xy = this.isVertical? 'y': 'x';
            const lefttop = this.isVertical? 'top': 'left';

            if(position[xy] < 0){
                position[xy] = 0;
            }

            if(position[xy] > rect[size]){
                position[xy] = rect[size];
            }

            if(handler === this.handler1 && position[xy] >= this.handler2[lefttop]){
                position[xy] = this.handler2[lefttop];
            }

            if(handler === this.handler2 && position[xy] <= this.handler1[lefttop]){
                position[xy] = this.handler1[lefttop];
            }

            //save current value
            handler[lefttop] = position[xy];
            //const value = Math.round(position[xy] * 100 / rect[size]); //value in %
            handler.value = this.getPreviewValue(position[xy], this.min, this.max);

            //update the position with steps
            if (this.step > 1) {
                const stepValue = Math.ceil(handler.value / this.step) * this.step;
                handler.value = stepValue > this.max ? this.max : stepValue;
                const step = rect[size] / (this.max / this.step);
    
                position[xy] = Math.fround(position[xy] / step) * step;
            }

            handler.style[lefttop] = (position[xy]) + 'px';

            //update range element
            this.range.style[lefttop] = this.handler1[lefttop] + 'px';

            const rangeHeight = this.handler2[lefttop] - this.handler1[lefttop];
            this.range.style[size] = (rangeHeight >= 0 ? rangeHeight : 0) + 'px';

            // Update display values regardless of dragging state
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

            //call callback function only if not dragging or if explicitly requested via sendCallback
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
     * subtraction of 2 vectors
     * @param {Object} v1 - vector #1
     * @param {Object} v2 - vector #2
     */
    static sub(v1, v2){

        return {
            x: v1.x - v2.x,
            y: v1.y - v2.y
        };
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

        const vector = {
            x: rect.left,
            y: rect.top
        };

        return BaseSliderControl.sub(point, vector);
    }

}

export default BaseSliderControl;