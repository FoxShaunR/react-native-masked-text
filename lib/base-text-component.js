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
        let currSelection = self.state.selection;
        let newSelection = currSelection;
        let maxLength = self.state.value.length;

        return new Promise((resolve, reject) => {
            let maskedText = self._getMaskedValue(text);
            let currText = self.state.value;

			if(self._mustUpdateValue(maskedText)) {
                maxLength = maskedText.length;

                if(currText.length < maskedText.length){
                    let newChar = text.charAt(currSelection.start);
                    let addCnt = self.getMaskOffset(maskedText, newChar, currSelection.start) + 1;

                    newSelection = {
                        start: currSelection.start + addCnt,
                        end: currSelection.start + addCnt
                    }
                }else if(currText.length > maskedText.length){
                    newSelection = {
                        start: currSelection.start - 1,
                        end: currSelection.start - 1
                    }

                }
				self.setState({
                    value: maskedText,
                    selectionOverride: true
				}, () => {
					resolve(maskedText);
				});
			}
			else {
				resolve(this.state.value);
			}
        }).then(self.updateSelection(newSelection, maxLength));
    }

    updateSelection(selectionUpdate, maxLength){
        let self = this;
        let updateStart = (selectionUpdate.start > maxLength ? maxLength : selectionUpdate.start);
        let updateEnd = (selectionUpdate.end > maxLength ? maxLength: selectionUpdate.end);

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

    getMaskOffset(newValue, newChar, changePos){
        let self = this;
        let origValue = this.state.value;
        let maskCount = 0;

        for(var i = 0; i < changePos; i++){
            if (newValue.charAt(i) !== origValue.charAt(i)){
                maskCount++;
            }
        }

        for(var i = changePos; i < newValue.length; i++){
            if(newValue.charAt(i) !== newChar){
                maskCount++;
            }else{
                break;
            }
        }

        return maskCount;
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
