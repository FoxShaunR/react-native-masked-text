import React, { Component } from 'react';
import MaskResolver from './mask-resolver';

export default class BaseTextComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            type: props.type,
            value: '',
            options: null,
            selection: {
                start: 0,
                end: 0
            },
            selectionOverride: false 
        };

        this._resolveMaskHandler();
    }

    componentDidMount() {
        this._bindProps(this.props);
    }

    componentWillReceiveProps(nextProps) {
        this._bindProps(nextProps);
    }

    updateValue(text) {
        let self = this;

        return new Promise((resolve, reject) => {
            let maskedText = self._getMaskedValue(text);

			if(self._mustUpdateValue(maskedText)) {
                let newSelection = self.getSelectionUpdate(maskedText, text);

				self.setState({
                    value: maskedText,
                    selection: {
                        start: newSelection.start,
                        end: newSelection.end
                    },
                    selectionOverride: true
				}, () => {
					resolve(maskedText);
				});
			}
			else {
				resolve(this.state.value);
			}
        });
    }

    getSelectionUpdate(maskedText, updateText){
        let self = this;
        let maxLength = maskedText.length;
        let newSelection = {start: 0, end: 0};
        let currText = self.state.value;
        let currSelection = self.state.selection;

        if(updateText.length > currText.length){
            let newChar = updateText.charAt(currSelection.start);
            let addCnt = 1 + maskedText.substring(currSelection.start).indexOf(newChar);

            newSelection = {
                start: Math.min(currSelection.start + addCnt, maxLength),
                end: Math.min(currSelection.start + addCnt, maxLength)
            }
        }else{
            newSelection = {
                start: Math.min(currSelection.start - 1, maxLength),
                end: Math.min(currSelection.start - 1, maxLength)
            }
        }

        return newSelection;
    }

    updateSelection(selectionUpdate, maxLength){
        let self = this;
        let updateStart = Math.min(selectionUpdate.start, maxLength);
        let updateEnd = Math.min(selectionUpdate.end, maxLength);

        if(!self.state.selectionOverride){
            self.setState({
                selection: {
                    start: updateStart,
                    end: updateEnd
                }
            });
        }else{
            self.setState({
                selectionOverride: false
            });
        }
    }

    isValid() {
        return this._maskHandler.validate(
            this._getDefaultValue(this.state.value),
            this.state.options
        );
    }

    getRawValue() {
        return this._maskHandler.getRawValue(
            this._getDefaultValue(this.state.value),
            this.state.options
        );
    }

	_mustUpdateValue(newValue) {
		return this.state.value !== newValue;
	}

    _resolveMaskHandler() {
        this._maskHandler = MaskResolver.resolve(this.state.type);
    }

    _bindProps(props) {
        let self = this;
        let changeMaskHandler = this.state.type !== props.type;

        self.setState({
            type: props.type,
            options: props.options
        }, () => {
            if(changeMaskHandler) {
                self._resolveMaskHandler();
            }

			let value = self._getDefaultMaskedValue(props.value);

            self.setState({
                value: value,
                selection: {
                    start: value.length,
                    end: value.length
                }
            });
        });
    }

	_getDefaultMaskedValue(value) {
		if (this._getDefaultValue(value) === '') {
			return ''
		}

		return this._getMaskedValue(value)
	}

    _getMaskedValue(value) {
        let oldValue = this.state.value;

        return this._maskHandler.getValue(
            this._getDefaultValue(value),
            this.state.options,
            oldValue);
	}

    _getDefaultValue(value) {
		if(value === undefined || value === null) {
			return '';
		}

		return value;
	}
}
