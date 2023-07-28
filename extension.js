const cjkBracketPairs = {
    "【": "】",
    "（": "）",
    "「": "」",
    "『": "』",
};

const cjkDoubleBracketPairs = {
    "【【": "】】", 
    "（（": "））",

    "『「": "』」",
    "「『": "」』",
    "『『": "』』",
    "「「": "」」",
};

const cjkBracketToRefPatterns = {
    "【【": "[[", 
    "】】": "]]", 

    "（（": "((", 
    "））": "))", 

    "『「": "{{",
    "』」": "}}",

    "「『": "{{",
    "」』": "}}",   

    "『『": "{{",
    "』』": "}}",

    "「「": "{{",
    "」」": "}}",
};

const CJKToRoamSymbols = {
    "：：": "::", 
    "；；": ";;",
};

const CJKToRoamSymbolsCursorPositionAfterConverting = {
    "：：": "left", 
    "；；": "right",  
}

function assert (assertion) {
    if (!assertion) {
        throw "Assertion failed."
    }
}

function _dispatchManualEventWhenPreventingDefaultEventBehavior (originalEvent) {

    // For triggering Roam updating database, like what Roam does after handling '[' and '(' auto-pairing and deleteion.
    
    assert(originalEvent.cancelable);
    assert(originalEvent.defaultPrevented);

    assert(originalEvent instanceof KeyboardEvent);
    assert(originalEvent.type == 'keydown');

    assert(isEditingBlockWithDOMElement(originalEvent.target));

    setTimeout(() => {
        let manualEvent = new Event('input', originalEvent);
        originalEvent.target.dispatchEvent(manualEvent);
    }, 0);
}

function preventDefaultKeybordEventBehaviorForInputElementAndSetRangeTextPreservingCursorPosition(event, element, substitution, selectionStart, selectionEnd) {
    
    assert(event.target == element);
    assert(!event.defaultPrevented);

    assert(isEditingBlockWithDOMElement(element));

    element.setRangeText(substitution, selectionStart, selectionEnd, "preserve");

    event.preventDefault();

    _dispatchManualEventWhenPreventingDefaultEventBehavior(event);
}

function isEditingBlockWithDOMElement(element) {

    const isTextAreaElement = (element instanceof HTMLTextAreaElement);
    const isActiveElement = (element == document.activeElement);
    const isDOMElementOfBlock = element.className.includes('rm-block-input');

    return (
        isTextAreaElement
        && 
        isActiveElement
        && 
        isDOMElementOfBlock
    );
}

function isEditingBlockAndIsNotComposingWithKeyboardEvent(event) {
    const isEditingBlock = isEditingBlockWithDOMElement(event.target);
    const isNotComposing = event.isComposing != undefined && event.isComposing == false;
    return isEditingBlock && isNotComposing;
}

function handleKeyDown(event) {
	if (isEditingBlockAndIsNotComposingWithKeyboardEvent(event)) {

        const keyName = event.key;
        const inputElement = event.target;

        const selectionStart = inputElement.selectionStart;
        const selectionEnd = inputElement.selectionEnd;

        const textValue = inputElement.value;

        const charBeforeCursor = selectionStart > 0 ? textValue.charAt(selectionStart - 1) : null;
        const charAfterCursor = selectionEnd == textValue.length ? null : textValue.charAt(selectionEnd);

        if (Object.keys(cjkBracketPairs).includes(keyName)) {

            let substitution = textValue.substring(selectionStart, selectionEnd);

            const leftSide = charBeforeCursor + keyName;
            const rightSide = cjkBracketPairs[keyName] + charAfterCursor;

            if (Object.keys(cjkDoubleBracketPairs).includes(leftSide) && Object.values(cjkDoubleBracketPairs).includes(rightSide) && cjkDoubleBracketPairs[leftSide] === rightSide) {
                let leftPair = cjkBracketToRefPatterns[leftSide];
                let rightPair = cjkBracketToRefPatterns[rightSide];

                assert(leftPair != undefined);
                assert(rightPair != undefined);

                substitution = leftPair + substitution + rightPair;
                preventDefaultKeybordEventBehaviorForInputElementAndSetRangeTextPreservingCursorPosition(
                    event, inputElement, 
                    substitution, selectionStart - 1, selectionEnd + 1
                );
            }
            else {
                substitution = keyName + substitution + cjkBracketPairs[keyName];
                preventDefaultKeybordEventBehaviorForInputElementAndSetRangeTextPreservingCursorPosition(
                    event, inputElement, 
                    substitution, selectionStart, selectionEnd
                );
            }
            
            inputElement.setSelectionRange(selectionStart + 1, selectionEnd + 1)

        }
        else if (Object.keys(CJKToRoamSymbols).includes(charBeforeCursor + keyName)) {

            let substitution = CJKToRoamSymbols[charBeforeCursor + keyName];
            let cursorPositionAfterConverting = CJKToRoamSymbolsCursorPositionAfterConverting[charBeforeCursor + keyName];

            preventDefaultKeybordEventBehaviorForInputElementAndSetRangeTextPreservingCursorPosition(
                event, inputElement,
                substitution, selectionStart - 1, selectionEnd
            );

            if (cursorPositionAfterConverting == "left") {
                inputElement.setSelectionRange(0, 0);
            } 
            else if (cursorPositionAfterConverting == "right") {
                inputElement.setSelectionRange(selectionEnd + 1, selectionEnd + 1);
            }

        }
        else if (keyName === 'Backspace') {
            if (selectionStart == selectionEnd) {
                if (Object.keys(cjkBracketPairs).includes(charBeforeCursor) && Object.values(cjkBracketPairs).includes(charAfterCursor) && (cjkBracketPairs[charBeforeCursor] == charAfterCursor)) {
                    let substitution = '';
                    
                    preventDefaultKeybordEventBehaviorForInputElementAndSetRangeTextPreservingCursorPosition(
                        event, inputElement, 
                        substitution, selectionStart - 1, selectionEnd + 1
                    );
                }
            }
        }

    }
}


function onload() {
	document.addEventListener('keydown', handleKeyDown, false);
}

function onunload() {
	document.removeElementListener('keydown', handleKeyDown);
}

export default {
	onload: onload,
	onunload: onunload
}
