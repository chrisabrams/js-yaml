'use strict';


var common              = require('./common');
var YAMLException       = require('./exception');
var Mark                = require('./mark');
var DEFAULT_SAFE_SCHEMA = require('./schema/default_safe');
var DEFAULT_FULL_SCHEMA = require('./schema/default_full');


var _hasOwnProperty = Object.prototype.hasOwnProperty;

// Constants
var constant = new function () {

  this.KIND_STRING = 'string';
  this.KIND_ARRAY  = 'array';
  this.KIND_OBJECT = 'object';


  this.CONTEXT_FLOW_IN   = 1;
  this.CONTEXT_FLOW_OUT  = 2;
  this.CONTEXT_BLOCK_IN  = 3;
  this.CONTEXT_BLOCK_OUT = 4;


  this.CHOMPING_CLIP  = 1;
  this.CHOMPING_STRIP = 2;
  this.CHOMPING_KEEP  = 3;


  this.CHAR_TAB                  = 0x09;   /* Tab */
  this.CHAR_LINE_FEED            = 0x0A;   /* LF */
  this.CHAR_CARRIAGE_RETURN      = 0x0D;   /* CR */
  this.CHAR_SPACE                = 0x20;   /* Space */
  this.CHAR_EXCLAMATION          = 0x21;   /* ! */
  this.CHAR_DOUBLE_QUOTE         = 0x22;   /* " */
  this.CHAR_SHARP                = 0x23;   /* # */
  this.CHAR_PERCENT              = 0x25;   /* % */
  this.CHAR_AMPERSAND            = 0x26;   /* & */
  this.CHAR_SINGLE_QUOTE         = 0x27;   /* ' */
  this.CHAR_ASTERISK             = 0x2A;   /* * */
  this.CHAR_PLUS                 = 0x2B;   /* + */
  this.CHAR_COMMA                = 0x2C;   /* , */
  this.CHAR_MINUS                = 0x2D;   /* - */
  this.CHAR_DOT                  = 0x2E;   /* . */
  this.CHAR_SLASH                = 0x2F;   /* / */
  this.CHAR_DIGIT_ZERO           = 0x30;   /* 0 */
  this.CHAR_DIGIT_ONE            = 0x31;   /* 1 */
  this.CHAR_DIGIT_NINE           = 0x39;   /* 9 */
  this.CHAR_COLON                = 0x3A;   /* : */
  this.CHAR_LESS_THAN            = 0x3C;   /* < */
  this.CHAR_GREATER_THAN         = 0x3E;   /* > */
  this.CHAR_QUESTION             = 0x3F;   /* ? */
  this.CHAR_COMMERCIAL_AT        = 0x40;   /* @ */
  this.CHAR_CAPITAL_A            = 0x41;   /* A */
  this.CHAR_CAPITAL_F            = 0x46;   /* F */
  this.CHAR_CAPITAL_L            = 0x4C;   /* L */
  this.CHAR_CAPITAL_N            = 0x4E;   /* N */
  this.CHAR_CAPITAL_P            = 0x50;   /* P */
  this.CHAR_CAPITAL_U            = 0x55;   /* U */
  this.CHAR_LEFT_SQUARE_BRACKET  = 0x5B;   /* [ */
  this.CHAR_BACKSLASH            = 0x5C;   /* \ */
  this.CHAR_RIGHT_SQUARE_BRACKET = 0x5D;   /* ] */
  this.CHAR_UNDERSCORE           = 0x5F;   /* _ */
  this.CHAR_GRAVE_ACCENT         = 0x60;   /* ` */
  this.CHAR_SMALL_A              = 0x61;   /* a */
  this.CHAR_SMALL_B              = 0x62;   /* b */
  this.CHAR_SMALL_E              = 0x65;   /* e */
  this.CHAR_SMALL_F              = 0x66;   /* f */
  this.CHAR_SMALL_N              = 0x6E;   /* n */
  this.CHAR_SMALL_R              = 0x72;   /* r */
  this.CHAR_SMALL_T              = 0x74;   /* t */
  this.CHAR_SMALL_U              = 0x75;   /* u */
  this.CHAR_SMALL_V              = 0x76;   /* v */
  this.CHAR_SMALL_X              = 0x78;   /* x */
  this.CHAR_LEFT_CURLY_BRACKET   = 0x7B;   /* { */
  this.CHAR_VERTICAL_LINE        = 0x7C;   /* | */
  this.CHAR_RIGHT_CURLY_BRACKET  = 0x7D;   /* } */
};

var SIMPLE_ESCAPE_SEQUENCES = {};

SIMPLE_ESCAPE_SEQUENCES[constant.CHAR_DIGIT_ZERO]   = '\x00';
SIMPLE_ESCAPE_SEQUENCES[constant.CHAR_SMALL_A]      = '\x07';
SIMPLE_ESCAPE_SEQUENCES[constant.CHAR_SMALL_B]      = '\x08';
SIMPLE_ESCAPE_SEQUENCES[constant.CHAR_SMALL_T]      = '\x09';
SIMPLE_ESCAPE_SEQUENCES[constant.CHAR_TAB]          = '\x09';
SIMPLE_ESCAPE_SEQUENCES[constant.CHAR_SMALL_N]      = '\x0A';
SIMPLE_ESCAPE_SEQUENCES[constant.CHAR_SMALL_V]      = '\x0B';
SIMPLE_ESCAPE_SEQUENCES[constant.CHAR_SMALL_F]      = '\x0C';
SIMPLE_ESCAPE_SEQUENCES[constant.CHAR_SMALL_R]      = '\x0D';
SIMPLE_ESCAPE_SEQUENCES[constant.CHAR_SMALL_E]      = '\x1B';
SIMPLE_ESCAPE_SEQUENCES[constant.CHAR_SPACE]        = ' ';
SIMPLE_ESCAPE_SEQUENCES[constant.CHAR_DOUBLE_QUOTE] = '\x22';
SIMPLE_ESCAPE_SEQUENCES[constant.CHAR_SLASH]        = '/';
SIMPLE_ESCAPE_SEQUENCES[constant.CHAR_BACKSLASH]    = '\x5C';
SIMPLE_ESCAPE_SEQUENCES[constant.CHAR_CAPITAL_N]    = '\x85';
SIMPLE_ESCAPE_SEQUENCES[constant.CHAR_UNDERSCORE]   = '\xA0';
SIMPLE_ESCAPE_SEQUENCES[constant.CHAR_CAPITAL_L]    = '\u2028';
SIMPLE_ESCAPE_SEQUENCES[constant.CHAR_CAPITAL_P]    = '\u2029';


var HEXADECIMAL_ESCAPE_SEQUENCES = {};

HEXADECIMAL_ESCAPE_SEQUENCES[constant.CHAR_SMALL_X]   = 2;
HEXADECIMAL_ESCAPE_SEQUENCES[constant.CHAR_SMALL_U]   = 4;
HEXADECIMAL_ESCAPE_SEQUENCES[constant.CHAR_CAPITAL_U] = 8;


var PATTERN_NON_PRINTABLE         = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uD800-\uDFFF\uFFFE\uFFFF]/;
var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
var PATTERN_FLOW_INDICATORS       = /[,\[\]\{\}]/;
var PATTERN_TAG_HANDLE            = /^(?:!|!!|![a-z\-]+!)$/i;
var PATTERN_TAG_URI               = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;


function State(input, options) {
  this.input    = input;

  this.filename = options['filename'] || null;
  this.schema   = options['schema']   || DEFAULT_FULL_SCHEMA;
  this.resolve  = options['resolve']  || true;
  this.validate = options['validate'] || true;
  this.strict   = options['strict']   || false;
  this.legacy   = options['legacy']   || false;

  this.implicitTypes     = this.schema.compiledImplicit;
  this.typeMap           = this.schema.compiledTypeMap;

  this.length     = input.length;
  this.position   = 0;
  this.line       = 0;
  this.lineStart  = 0;
  this.lineIndent = 0;
  this.character  = input.charCodeAt(0 /*position*/);

  /*
  this.version;
  this.checkLineBreaks;
  this.tagMap;
  this.anchorMap;
  this.tag;
  this.anchor;
  this.kind;
  this.result;*/

}


function generateError(state, message) {
  return new YAMLException(
    message,
    new Mark(state.filename, state.input, state.position, state.line, (state.position - state.lineStart)));
}

function throwError(state, message) {
  throw generateError(state, message);
}

function throwWarning(state, message) {
  var error = generateError(state, message);

  if (state.strict) {
    throw error;
  } else {
    console.warn(error.toString());
  }
}


var directiveHandlers = {

  'YAML': function handleYamlDirective(state, name, args) {

      var match, major, minor;

      if (null !== state.version) {
        throwError(state, 'duplication of %YAML directive');
      }

      if (1 !== args.length) {
        throwError(state, 'YAML directive accepts exactly one argument');
      }

      match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);

      if (null === match) {
        throwError(state, 'ill-formed argument of the YAML directive');
      }

      major = parseInt(match[1], 10);
      minor = parseInt(match[2], 10);

      if (1 !== major) {
        throwError(state, 'unacceptable YAML version of the document');
      }

      state.version = args[0];
      state.checkLineBreaks = (minor < 2);

      if (1 !== minor && 2 !== minor) {
        throwWarning(state, 'unsupported YAML version of the document');
      }
    },

  'TAG': function handleTagDirective(state, name, args) {

      var handle, prefix;

      if (2 !== args.length) {
        throwError(state, 'TAG directive accepts exactly two arguments');
      }

      handle = args[0];
      prefix = args[1];

      if (!PATTERN_TAG_HANDLE.test(handle)) {
        throwError(state, 'ill-formed tag handle (first argument) of the TAG directive');
      }

      if (_hasOwnProperty.call(state.tagMap, handle)) {
        throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
      }

      if (!PATTERN_TAG_URI.test(prefix)) {
        throwError(state, 'ill-formed tag prefix (second argument) of the TAG directive');
      }

      state.tagMap[handle] = prefix;
    }
};


function captureSegment(state, start, end, checkJson) {
  var _position, _length, _character, _result;

  if (start < end) {
    _result = state.input.slice(start, end);

    if (checkJson && state.validate) {
      for (_position = 0, _length = _result.length;
           _position < _length;
           _position += 1) {
        _character = _result.charCodeAt(_position);
        if (!(0x09 === _character ||
              0x20 <= _character && _character <= 0x10FFFF)) {
          throwError(state, 'expected valid JSON character');
        }
      }
    }

    state.result += _result;
  }
}

function mergeMappings(state, destination, source) {
  var sourceKeys, key, index, quantity;

  if (!common.isObject(source)) {
    throwError(state, 'cannot merge mappings; the provided source object is unacceptable');
  }

  sourceKeys = Object.keys(source);

  for (index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
    key = sourceKeys[index];

    if (!_hasOwnProperty.call(destination, key)) {
      destination[key] = source[key];
    }
  }
}

function storeMappingPair(state, _result, keyTag, keyNode, valueNode) {
  var index, quantity;

  keyNode = String(keyNode);

  if (null === _result) {
    _result = {};
  }

  if ('tag:yaml.org,2002:merge' === keyTag) {
    if (Array.isArray(valueNode)) {
      for (index = 0, quantity = valueNode.length; index < quantity; index += 1) {
        mergeMappings(state, _result, valueNode[index]);
      }
    } else {
      mergeMappings(state, _result, valueNode);
    }
  } else {
    _result[keyNode] = valueNode;
  }

  return _result;
}

function readLineBreak(state) {
  var c = constant;

  if (c.CHAR_LINE_FEED === state.character) {
    state.position += 1;
  } else if (c.CHAR_CARRIAGE_RETURN === state.character) {
    if (c.CHAR_LINE_FEED === state.input.charCodeAt(state.position + 1)) {
      state.position += 2;
    } else {
      state.position += 1;
    }
  } else {
    throwError(state, 'a line break is expected');
  }

  state.line += 1;
  state.lineStart = state.position;
  state.character = state.input.charCodeAt(state.position);
}

function skipSeparationSpace(state, allowComments, checkIndent) {
  var lineBreaks = 0,
      c = constant;

  while (state.position < state.length) {
    while (c.CHAR_SPACE === state.character || c.CHAR_TAB === state.character) {
      state.character = state.input.charCodeAt(++state.position);
    }

    if (allowComments && c.CHAR_SHARP === state.character) {
      do { state.character = state.input.charCodeAt(++state.position); }
      while (state.position < state.length &&
             c.CHAR_LINE_FEED !== state.character &&
             c.CHAR_CARRIAGE_RETURN !== state.character);
    }

    if (c.CHAR_LINE_FEED === state.character || c.CHAR_CARRIAGE_RETURN === state.character) {
      readLineBreak(state);
      lineBreaks += 1;
      state.lineIndent = 0;

      while (c.CHAR_SPACE === state.character) {
        state.lineIndent += 1;
        state.character = state.input.charCodeAt(++state.position);
      }

      if (state.lineIndent < checkIndent) {
        throwWarning(state, 'deficient indentation');
      }
    } else {
      break;
    }
  }

  return lineBreaks;
}

function testDocumentSeparator(state) {
  var _position, _character,
      c = constant;

  if (state.position === state.lineStart &&
      (c.CHAR_MINUS === state.character || c.CHAR_DOT === state.character) &&
      state.input.charCodeAt(state.position + 1) === state.character &&
      state.input.charCodeAt(state.position + 2) === state.character) {

    _position = state.position + 3;
    _character = state.input.charCodeAt(_position);

    if (_position >= state.length ||
        c.CHAR_SPACE           === _character ||
        c.CHAR_TAB             === _character ||
        c.CHAR_LINE_FEED       === _character ||
        c.CHAR_CARRIAGE_RETURN === _character) {
      return true;
    }
  }

  return false;
}

function writeFoldedLines(state, count) {
  if (1 === count) {
    state.result += ' ';
  } else if (count > 1) {
    state.result += common.repeat('\n', count - 1);
  }
}


function readPlainScalar(state, nodeIndent, withinFlowCollection) {
  var preceding,
      following,
      captureStart,
      captureEnd,
      hasPendingContent,
      _line,
      _lineStart,
      _lineIndent,
      _kind   = state.kind,
      _result = state.result,
      c       = constant;

  if (c.CHAR_SPACE                === state.character ||
      c.CHAR_TAB                  === state.character ||
      c.CHAR_LINE_FEED            === state.character ||
      c.CHAR_CARRIAGE_RETURN      === state.character ||
      c.CHAR_COMMA                === state.character ||
      c.CHAR_LEFT_SQUARE_BRACKET  === state.character ||
      c.CHAR_RIGHT_SQUARE_BRACKET === state.character ||
      c.CHAR_LEFT_CURLY_BRACKET   === state.character ||
      c.CHAR_RIGHT_CURLY_BRACKET  === state.character ||
      c.CHAR_SHARP                === state.character ||
      c.CHAR_AMPERSAND            === state.character ||
      c.CHAR_ASTERISK             === state.character ||
      c.CHAR_EXCLAMATION          === state.character ||
      c.CHAR_VERTICAL_LINE        === state.character ||
      c.CHAR_GREATER_THAN         === state.character ||
      c.CHAR_SINGLE_QUOTE         === state.character ||
      c.CHAR_DOUBLE_QUOTE         === state.character ||
      c.CHAR_PERCENT              === state.character ||
      c.CHAR_COMMERCIAL_AT        === state.character ||
      c.CHAR_GRAVE_ACCENT         === state.character) {
    return false;
  }

  if (c.CHAR_QUESTION === state.character ||
      c.CHAR_MINUS === state.character) {
    following = state.input.charCodeAt(state.position + 1);

    if (c.CHAR_SPACE                 === following ||
        c.CHAR_TAB                   === following ||
        c.CHAR_LINE_FEED             === following ||
        c.CHAR_CARRIAGE_RETURN       === following ||
        withinFlowCollection &&
        (c.CHAR_COMMA                === following ||
         c.CHAR_LEFT_SQUARE_BRACKET  === following ||
         c.CHAR_RIGHT_SQUARE_BRACKET === following ||
         c.CHAR_LEFT_CURLY_BRACKET   === following ||
         c.CHAR_RIGHT_CURLY_BRACKET  === following)) {
      return false;
    }
  }

  state.kind = c.KIND_STRING;
  state.result = '';
  captureStart = captureEnd = state.position;
  hasPendingContent = false;

  while (state.position < state.length) {
    if (c.CHAR_COLON === state.character) {
      following = state.input.charCodeAt(state.position + 1);

      if (c.CHAR_SPACE                 === following ||
          c.CHAR_TAB                   === following ||
          c.CHAR_LINE_FEED             === following ||
          c.CHAR_CARRIAGE_RETURN       === following ||
          withinFlowCollection &&
          (c.CHAR_COMMA                === following ||
           c.CHAR_LEFT_SQUARE_BRACKET  === following ||
           c.CHAR_RIGHT_SQUARE_BRACKET === following ||
           c.CHAR_LEFT_CURLY_BRACKET   === following ||
           c.CHAR_RIGHT_CURLY_BRACKET  === following)) {
        break;
      }

    } else if (c.CHAR_SHARP === state.character) {
      preceding = state.input.charCodeAt(state.position - 1);

      if (c.CHAR_SPACE           === preceding ||
          c.CHAR_TAB             === preceding ||
          c.CHAR_LINE_FEED       === preceding ||
          c.CHAR_CARRIAGE_RETURN === preceding) {
        break;
      }

    } else if ((state.position === state.lineStart && testDocumentSeparator(state)) ||
               withinFlowCollection &&
               (c.CHAR_COMMA                === state.character ||
                c.CHAR_LEFT_SQUARE_BRACKET  === state.character ||
                c.CHAR_RIGHT_SQUARE_BRACKET === state.character ||
                c.CHAR_LEFT_CURLY_BRACKET   === state.character ||
                c.CHAR_RIGHT_CURLY_BRACKET  === state.character)) {
      break;

    } else if (c.CHAR_LINE_FEED === state.character ||
               c.CHAR_CARRIAGE_RETURN === state.character) {
      _line = state.line;
      _lineStart = state.lineStart;
      _lineIndent = state.lineIndent;
      skipSeparationSpace(state, false, -1);

      if (state.lineIndent >= nodeIndent) {
        hasPendingContent = true;
        continue;
      } else {
        state.position = captureEnd;
        state.line = _line;
        state.lineStart = _lineStart;
        state.lineIndent = _lineIndent;
        state.character = state.input.charCodeAt(state.position);
        break;
      }
    }

    if (hasPendingContent) {
      captureSegment(state, captureStart, captureEnd, false);
      writeFoldedLines(state, state.line - _line);
      captureStart = captureEnd = state.position;
      hasPendingContent = false;
    }

    if (c.CHAR_SPACE !== state.character && c.CHAR_TAB !== state.character) {
      captureEnd = state.position + 1;
    }

    state.character = state.input.charCodeAt(++state.position);
  }

  captureSegment(state, captureStart, captureEnd, false);

  if (state.result) {
    return true;
  } else {
    state.kind = _kind;
    state.result = _result;
    return false;
  }
}

function readSingleQuotedScalar(state, nodeIndent) {
  var captureStart, captureEnd,
      c = constant;

  if (c.CHAR_SINGLE_QUOTE !== state.character) {
    return false;
  }

  state.kind = c.KIND_STRING;
  state.result = '';
  state.character = state.input.charCodeAt(++state.position);
  captureStart = captureEnd = state.position;

  while (state.position < state.length) {
    if (c.CHAR_SINGLE_QUOTE === state.character) {
      captureSegment(state, captureStart, state.position, true);
      state.character = state.input.charCodeAt(++state.position);

      if (c.CHAR_SINGLE_QUOTE === state.character) {
        captureStart = captureEnd = state.position;
        state.character = state.input.charCodeAt(++state.position);
      } else {
        return true;
      }

    } else if (c.CHAR_LINE_FEED === state.character ||
               c.CHAR_CARRIAGE_RETURN === state.character) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;
      state.character = state.input.charCodeAt(state.position);

    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, 'unexpected end of the document within a single quoted scalar');

    } else {
      state.character = state.input.charCodeAt(++state.position);
      captureEnd = state.position;
    }
  }

  throwError(state, 'unexpected end of the stream within a single quoted scalar');
}

function readDoubleQuotedScalar(state, nodeIndent) {
  var captureStart,
      captureEnd,
      hexLength,
      hexIndex,
      hexOffset,
      hexResult,
      c = constant;

  if (c.CHAR_DOUBLE_QUOTE !== state.character) {
    return false;
  }

  state.kind = c.KIND_STRING;
  state.result = '';
  state.character = state.input.charCodeAt(++state.position);
  captureStart = captureEnd = state.position;

  while (state.position < state.length) {
    if (c.CHAR_DOUBLE_QUOTE === state.character) {
      captureSegment(state, captureStart, state.position, true);
      state.character = state.input.charCodeAt(++state.position);
      return true;

    } else if (c.CHAR_BACKSLASH === state.character) {
      captureSegment(state, captureStart, state.position, true);
      state.character = state.input.charCodeAt(++state.position);

      if (c.CHAR_LINE_FEED       === state.character ||
          c.CHAR_CARRIAGE_RETURN === state.character) {
        skipSeparationSpace(state, false, nodeIndent);

      } else if (SIMPLE_ESCAPE_SEQUENCES[state.character]) {
        state.result += SIMPLE_ESCAPE_SEQUENCES[state.character];
        state.character = state.input.charCodeAt(++state.position);

      } else if (HEXADECIMAL_ESCAPE_SEQUENCES[state.character]) {
        hexLength = HEXADECIMAL_ESCAPE_SEQUENCES[state.character];
        hexResult = 0;

        for (hexIndex = 1; hexIndex <= hexLength; hexIndex += 1) {
          hexOffset = (hexLength - hexIndex) * 4;
          state.character = state.input.charCodeAt(++state.position);

          if (c.CHAR_DIGIT_ZERO <= state.character && state.character <= c.CHAR_DIGIT_NINE) {
            hexResult |= (state.character - c.CHAR_DIGIT_ZERO) << hexOffset;

          } else if (c.CHAR_CAPITAL_A <= state.character && state.character <= c.CHAR_CAPITAL_F) {
            hexResult |= (state.character - c.CHAR_CAPITAL_A + 10) << hexOffset;

          } else if (c.CHAR_SMALL_A <= state.character && state.character <= c.CHAR_SMALL_F) {
            hexResult |= (state.character - c.CHAR_SMALL_A + 10) << hexOffset;

          } else {
            throwError(state, 'expected hexadecimal character');
          }
        }

        state.result += String.fromCharCode(hexResult);
        state.character = state.input.charCodeAt(++state.position);

      } else {
        throwError(state, 'unknown escape sequence');
      }

      captureStart = captureEnd = state.position;

    } else if (c.CHAR_LINE_FEED === state.character ||
               c.CHAR_CARRIAGE_RETURN === state.character) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;
      state.character = state.input.charCodeAt(state.position);

    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, 'unexpected end of the document within a double quoted scalar');

    } else {
      state.character = state.input.charCodeAt(++state.position);
      captureEnd = state.position;
    }
  }

  throwError(state, 'unexpected end of the stream within a double quoted scalar');
}

function readFlowCollection(state, nodeIndent) {
  var readNext = true,
      _line,
      _tag     = state.tag,
      _result,
      following,
      terminator,
      isPair,
      isExplicitPair,
      isMapping,
      keyNode,
      keyTag,
      valueNode,
      c         = constant;

  switch (state.character) {
  case c.CHAR_LEFT_SQUARE_BRACKET:
    terminator = c.CHAR_RIGHT_SQUARE_BRACKET;
    isMapping = false;
    _result = [];
    break;

  case c.CHAR_LEFT_CURLY_BRACKET:
    terminator = c.CHAR_RIGHT_CURLY_BRACKET;
    isMapping = true;
    _result = {};
    break;

  default:
    return false;
  }

  if (null !== state.anchor) {
    state.anchorMap[state.anchor] = _result;
  }

  state.character = state.input.charCodeAt(++state.position);

  while (state.position < state.length) {
    skipSeparationSpace(state, true, nodeIndent);

    if (state.character === terminator) {
      state.character = state.input.charCodeAt(++state.position);
      state.tag = _tag;
      state.kind = isMapping ? c.KIND_OBJECT : c.KIND_ARRAY;
      state.result = _result;
      return true;
    } else if (!readNext) {
      throwError(state, 'missed comma between flow collection entries');
    }

    keyTag = keyNode = valueNode = null;
    isPair = isExplicitPair = false;

    if (c.CHAR_QUESTION === state.character) {
      following = state.input.charCodeAt(state.position + 1);

      if (c.CHAR_SPACE === following ||
          c.CHAR_TAB === following ||
          c.CHAR_LINE_FEED === following ||
          c.CHAR_CARRIAGE_RETURN === following) {
        isPair = isExplicitPair = true;
        state.position += 1;
        state.character = following;
        skipSeparationSpace(state, true, nodeIndent);
      }
    }

    _line = state.line;
    composeNode(state, nodeIndent, c.CONTEXT_FLOW_IN, false, true);
    keyTag = state.tag;
    keyNode = state.result;
    skipSeparationSpace(state, true, nodeIndent);

    if ((isExplicitPair || state.line === _line) && c.CHAR_COLON === state.character) {
      isPair = true;
      state.character = state.input.charCodeAt(++state.position);
      skipSeparationSpace(state, true, nodeIndent);
      composeNode(state, nodeIndent, c.CONTEXT_FLOW_IN, false, true);
      valueNode = state.result;
    }

    if (isMapping) {
      storeMappingPair(state, _result, keyTag, keyNode, valueNode);
    } else if (isPair) {
      _result.push(storeMappingPair(state, null, keyTag, keyNode, valueNode));
    } else {
      _result.push(keyNode);
    }

    skipSeparationSpace(state, true, nodeIndent);

    if (c.CHAR_COMMA === state.character) {
      readNext = true;
      state.character = state.input.charCodeAt(++state.position);
    } else {
      readNext = false;
    }
  }

  throwError(state, 'unexpected end of the stream within a flow collection');
}

function readBlockScalar(state, nodeIndent) {
  var captureStart,
      folding,
      c               = constant,
      chomping        = c.CHOMPING_CLIP,
      detectedIndent  = false,
      textIndent      = nodeIndent,
      emptyLines      = 0,
      atMoreIndented  = false;

  switch (state.character) {
  case c.CHAR_VERTICAL_LINE:
    folding = false;
    break;

  case c.CHAR_GREATER_THAN:
    folding = true;
    break;

  default:
    return false;
  }

  state.kind = c.KIND_STRING;
  state.result = '';

  while (state.position < state.length) {
    state.character = state.input.charCodeAt(++state.position);

    if (c.CHAR_PLUS === state.character || c.CHAR_MINUS === state.character) {
      if (c.CHOMPING_CLIP === chomping) {
        chomping = (c.CHAR_PLUS === state.character) ? c.CHOMPING_KEEP : c.CHOMPING_STRIP;
      } else {
        throwError(state, 'repeat of a chomping mode identifier');
      }

    } else if (c.CHAR_DIGIT_ZERO <= state.character && state.character <= c.CHAR_DIGIT_NINE) {
      if (c.CHAR_DIGIT_ZERO === state.character) {
        throwError(state, 'bad explicit indentation width of a block scalar; it cannot be less than one');
      } else if (!detectedIndent) {
        textIndent = nodeIndent + (state.character - c.CHAR_DIGIT_ONE);
        detectedIndent = true;
      } else {
        throwError(state, 'repeat of an indentation width identifier');
      }

    } else {
      break;
    }
  }

  if (c.CHAR_SPACE === state.character || c.CHAR_TAB === state.character) {
    do { state.character = state.input.charCodeAt(++state.position); }
    while (c.CHAR_SPACE === state.character || c.CHAR_TAB === state.character);

    if (c.CHAR_SHARP === state.character) {
      do { state.character = state.input.charCodeAt(++state.position); }
      while (state.position < state.length &&
             c.CHAR_LINE_FEED !== state.character &&
             c.CHAR_CARRIAGE_RETURN !== state.character);
    }
  }

  while (state.position < state.length) {
    readLineBreak(state);
    state.lineIndent = 0;

    while ((!detectedIndent || state.lineIndent < textIndent) &&
           (c.CHAR_SPACE === state.character)) {
      state.lineIndent += 1;
      state.character = state.input.charCodeAt(++state.position);
    }

    if (!detectedIndent && state.lineIndent > textIndent) {
      textIndent = state.lineIndent;
    }

    if (c.CHAR_LINE_FEED === state.character || c.CHAR_CARRIAGE_RETURN === state.character) {
      emptyLines += 1;
      continue;
    }

    // End of the scalar.
    if (state.lineIndent < textIndent) {

      // Perform the chomping.
      switch (chomping) {
      case c.CHOMPING_KEEP:
        state.result += common.repeat('\n', emptyLines);
        break;

      case c.CHOMPING_CLIP:
        if (detectedIndent) { // i.e. only if the scalar is not empty.
          state.result += '\n';
        }
        break;
      }

      // Break this `while` cycle and go to the funciton's epilogue.
      break;
    }

    // Folded style: use fancy rules to handle line breaks.
    if (folding) {

      // Lines starting with white space characters (more-indented lines) are not folded.
      if (c.CHAR_SPACE === state.character || c.CHAR_TAB === state.character) {
        atMoreIndented = true;
        state.result += common.repeat('\n', emptyLines + 1);

      // End of more-indented block.
      } else if (atMoreIndented) {
        atMoreIndented = false;
        state.result += common.repeat('\n', emptyLines + 1);

      // Just one line break - perceive as the same line.
      } else if (0 === emptyLines) {
        if (detectedIndent) { // i.e. only if we have already read some scalar content.
          state.result += ' ';
        }

      // Several line breaks - perceive as different lines.
      } else {
        state.result += common.repeat('\n', emptyLines);
      }

    // Literal style: just add exact number of line breaks between content lines.
    } else {
      state.result += common.repeat('\n', emptyLines + 1);
    }

    detectedIndent = true;
    emptyLines = 0;
    captureStart = state.position;

    do { state.character = state.input.charCodeAt(++state.position); }
    while (state.position < state.length &&
           c.CHAR_LINE_FEED !== state.character &&
           c.CHAR_CARRIAGE_RETURN !== state.character);

    captureSegment(state, captureStart, state.position, false);
  }

  return true;
}

function readBlockSequence(state, nodeIndent) {
  var _line,
      _tag      = state.tag,
      _result   = [],
      following,
      detected  = false,
      c         = constant;

  if (null !== state.anchor) {
    state.anchorMap[state.anchor] = _result;
  }

  while (state.position < state.length) {
    if (c.CHAR_MINUS !== state.character) {
      break;
    }

    following = state.input.charCodeAt(state.position + 1);

    if (c.CHAR_SPACE           !== following &&
        c.CHAR_TAB             !== following &&
        c.CHAR_LINE_FEED       !== following &&
        c.CHAR_CARRIAGE_RETURN !== following) {
      break;
    }

    detected = true;
    state.position += 1;
    state.character = following;

    if (skipSeparationSpace(state, true, -1)) {
      if (state.lineIndent <= nodeIndent) {
        _result.push(null);
        continue;
      }
    }

    _line = state.line;
    composeNode(state, nodeIndent, c.CONTEXT_BLOCK_IN, false, true);
    _result.push(state.result);
    skipSeparationSpace(state, true, -1);

    if ((state.line === _line || state.lineIndent > nodeIndent) && state.position < state.length) {
      throwError(state, 'bad indentation of a sequence entry');
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }

  if (detected) {
    state.tag = _tag;
    state.kind = c.KIND_ARRAY;
    state.result = _result;
    return true;
  } else {
    return false;
  }
}

function readBlockMapping(state, nodeIndent) {
  var following,
      allowCompact,
      _line,
      _tag          = state.tag,
      _result       = {},
      keyTag        = null,
      keyNode       = null,
      valueNode     = null,
      atExplicitKey = false,
      detected      = false,
      c             = constant;

  if (null !== state.anchor) {
    state.anchorMap[state.anchor] = _result;
  }

  while (state.position < state.length) {
    following = state.input.charCodeAt(state.position + 1);
    _line = state.line; // Save the current line.

    //
    // Explicit notation case. There are two separate blocks:
    // first for the key (denoted by "?") and second for the value (denoted by ":")
    //
    if ((c.CHAR_QUESTION        === state.character ||
         c.CHAR_COLON           === state.character) &&
        (c.CHAR_SPACE           === following ||
         c.CHAR_TAB             === following ||
         c.CHAR_LINE_FEED       === following ||
         c.CHAR_CARRIAGE_RETURN === following)) {

      if (c.CHAR_QUESTION === state.character) {
        if (atExplicitKey) {
          storeMappingPair(state, _result, keyTag, keyNode, null);
          keyTag = keyNode = valueNode = null;
        }

        detected = true;
        atExplicitKey = true;
        allowCompact = true;

      } else if (atExplicitKey) {
        // i.e. CHAR_COLON === character after the explicit key.
        atExplicitKey = false;
        allowCompact = true;

      } else {
        throwError(state, 'incomplete explicit mapping pair; a key node is missed');
      }

      state.position += 1;
      state.character = following;

    //
    // Implicit notation case. Flow-style node as the key first, then ":", and the value.
    //
    } else if (composeNode(state, nodeIndent, c.CONTEXT_FLOW_OUT, false, true)) {
      if (state.line === _line) {
        while (c.CHAR_SPACE === state.character ||
               c.CHAR_TAB === state.character) {
          state.character = state.input.charCodeAt(++state.position);
        }

        if (c.CHAR_COLON === state.character) {
          state.character = state.input.charCodeAt(++state.position);

          if (c.CHAR_SPACE           !== state.character &&
              c.CHAR_TAB             !== state.character &&
              c.CHAR_LINE_FEED       !== state.character &&
              c.CHAR_CARRIAGE_RETURN !== state.character) {
            throwError(state, 'a whitespace character is expected after the key-value separator within a block mapping');
          }

          if (atExplicitKey) {
            storeMappingPair(state, _result, keyTag, keyNode, null);
            keyTag = keyNode = valueNode = null;
          }

          detected = true;
          atExplicitKey = false;
          allowCompact = false;
          keyTag = state.tag;
          keyNode = state.result;

        } else if (detected) {
          throwError(state, 'can not read an implicit mapping pair; a colon is missed');

        } else {
          state.tag = _tag;
          return true; // Keep the result of `composeNode`.
        }

      } else if (detected) {
        throwError(state, 'can not read a block mapping entry; a multiline key may not be an implicit key');

      } else {
        state.tag = _tag;
        return true; // Keep the result of `composeNode`.
      }

    } else {
      break; // Reading is done. Go to the epilogue.
    }

    //
    // Common reading code for both explicit and implicit notations.
    //
    if (state.line === _line || state.lineIndent > nodeIndent) {
      if (composeNode(state, nodeIndent, c.CONTEXT_BLOCK_OUT, true, allowCompact)) {
        if (atExplicitKey) {
          keyNode = state.result;
        } else {
          valueNode = state.result;
        }
      }

      if (!atExplicitKey) {
        storeMappingPair(state, _result, keyTag, keyNode, valueNode);
        keyTag = keyNode = valueNode = null;
      }

      skipSeparationSpace(state, true, -1);
    }

    if (state.lineIndent > nodeIndent && state.position < state.length) {
      throwError(state, 'bad indentation of a mapping entry');
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }

  //
  // Epilogue.
  //

  // Special case: last mapping's node contains only the key in explicit notation.
  if (atExplicitKey) {
    storeMappingPair(state, _result, keyTag, keyNode, null);
  }

  // Expose the resulting mapping.
  if (detected) {
    state.tag = _tag;
    state.kind = c.KIND_OBJECT;
    state.result = _result;
  }

  return detected;
}

function readTagProperty(state) {
  var _position,
      isVerbatim  = false,
      isNamed     = false,
      tagHandle,
      tagName,
      c           = constant;

  if (c.CHAR_EXCLAMATION !== state.character) {
    return false;
  }

  if (null !== state.tag) {
    throwError(state, 'duplication of a tag property');
  }

  state.character = state.input.charCodeAt(++state.position);

  if (c.CHAR_LESS_THAN === state.character) {
    isVerbatim = true;
    state.character = state.input.charCodeAt(++state.position);

  } else if (c.CHAR_EXCLAMATION === state.character) {
    isNamed = true;
    tagHandle = '!!';
    state.character = state.input.charCodeAt(++state.position);

  } else {
    tagHandle = '!';
  }

  _position = state.position;

  if (isVerbatim) {
    do { state.character = state.input.charCodeAt(++state.position); }
    while (state.position < state.length && c.CHAR_GREATER_THAN !== state.character);

    if (state.position < state.length) {
      tagName = state.input.slice(_position, state.position);
      state.character = state.input.charCodeAt(++state.position);
    } else {
      throwError(state, 'unexpected end of the stream within a verbatim tag');
    }
  } else {
    while (state.position < state.length &&
           c.CHAR_SPACE           !== state.character &&
           c.CHAR_TAB             !== state.character &&
           c.CHAR_LINE_FEED       !== state.character &&
           c.CHAR_CARRIAGE_RETURN !== state.character) {

      if (c.CHAR_EXCLAMATION === state.character) {
        if (!isNamed) {
          tagHandle = state.input.slice(_position - 1, state.position + 1);

          if (state.validate && !PATTERN_TAG_HANDLE.test(tagHandle)) {
            throwError(state, 'named tag handle cannot contain such characters');
          }

          isNamed = true;
          _position = state.position + 1;
        } else {
          throwError(state, 'tag suffix cannot contain exclamation marks');
        }
      }

      state.character = state.input.charCodeAt(++state.position);
    }

    tagName = state.input.slice(_position, state.position);

    if (state.validate && PATTERN_FLOW_INDICATORS.test(tagName)) {
      throwError(state, 'tag suffix cannot contain flow indicator characters');
    }
  }

  if (state.validate && tagName && !PATTERN_TAG_URI.test(tagName)) {
    throwError(state, 'tag name cannot contain such characters: ' + tagName);
  }

  if (isVerbatim) {
    state.tag = tagName;

  } else if (_hasOwnProperty.call(state.tagMap, tagHandle)) {
    state.tag = state.tagMap[tagHandle] + tagName;

  } else if ('!' === tagHandle) {
    state.tag = '!' + tagName;

  } else if ('!!' === tagHandle) {
    state.tag = 'tag:yaml.org,2002:' + tagName;

  } else {
    throwError(state, 'undeclared tag handle "' + tagHandle + '"');
  }

  return true;
}

function readAnchorProperty(state) {
  var _position, c = constant;

  if (c.CHAR_AMPERSAND !== state.character) {
    return false;
  }

  if (null !== state.anchor) {
    throwError(state, 'duplication of an anchor property');
  }

  state.character = state.input.charCodeAt(++state.position);
  _position = state.position;

  while (state.position < state.length &&
         c.CHAR_SPACE                !== state.character &&
         c.CHAR_TAB                  !== state.character &&
         c.CHAR_LINE_FEED            !== state.character &&
         c.CHAR_CARRIAGE_RETURN      !== state.character &&
         c.CHAR_COMMA                !== state.character &&
         c.CHAR_LEFT_SQUARE_BRACKET  !== state.character &&
         c.CHAR_RIGHT_SQUARE_BRACKET !== state.character &&
         c.CHAR_LEFT_CURLY_BRACKET   !== state.character &&
         c.CHAR_RIGHT_CURLY_BRACKET  !== state.character) {
    state.character = state.input.charCodeAt(++state.position);
  }

  if (state.position === _position) {
    throwError(state, 'name of an anchor node must contain at least one character');
  }

  state.anchor = state.input.slice(_position, state.position);
  return true;
}

function readAlias(state) {
  var _position, alias,
      c = constant;

  if (c.CHAR_ASTERISK !== state.character) {
    return false;
  }

  state.character = state.input.charCodeAt(++state.position);
  _position = state.position;

  while (state.position < state.length &&
         c.CHAR_SPACE                !== state.character &&
         c.CHAR_TAB                  !== state.character &&
         c.CHAR_LINE_FEED            !== state.character &&
         c.CHAR_CARRIAGE_RETURN      !== state.character &&
         c.CHAR_COMMA                !== state.character &&
         c.CHAR_LEFT_SQUARE_BRACKET  !== state.character &&
         c.CHAR_RIGHT_SQUARE_BRACKET !== state.character &&
         c.CHAR_LEFT_CURLY_BRACKET   !== state.character &&
         c.CHAR_RIGHT_CURLY_BRACKET  !== state.character) {
    state.character = state.input.charCodeAt(++state.position);
  }

  if (state.position === _position) {
    throwError(state, 'name of an alias node must contain at least one character');
  }

  alias = state.input.slice(_position, state.position);

  if (!state.anchorMap.hasOwnProperty(alias)) {
    throwError(state, 'unidentified alias "' + alias + '"');
  }

  state.result = state.anchorMap[alias];
  skipSeparationSpace(state, true, -1);
  return true;
}

function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
  var allowBlockStyles,
      allowBlockScalars,
      allowBlockCollections,
      atNewLine   = false,
      isIndented  = true,
      hasContent  = false,
      typeIndex,
      typeQuantity,
      type,
      typeLoader,
      flowIndent,
      blockIndent,
      _result,
      c           = constant;

  state.tag    = null;
  state.anchor = null;
  state.kind   = null;
  state.result = null;

  allowBlockStyles = allowBlockScalars = allowBlockCollections =
    c.CONTEXT_BLOCK_OUT === nodeContext ||
    c.CONTEXT_BLOCK_IN  === nodeContext;

  if (allowToSeek) {
    if (skipSeparationSpace(state, true, -1)) {
      atNewLine = true;

      if (state.lineIndent === parentIndent) {
        isIndented = false;

      } else if (state.lineIndent > parentIndent) {
        isIndented = true;

      } else {
        return false;
      }
    }
  }

  if (isIndented) {
    while (readTagProperty(state) || readAnchorProperty(state)) {
      if (skipSeparationSpace(state, true, -1)) {
        atNewLine = true;

        if (state.lineIndent > parentIndent) {
          isIndented = true;
          allowBlockCollections = allowBlockStyles;

        } else if (state.lineIndent === parentIndent) {
          isIndented = false;
          allowBlockCollections = allowBlockStyles;

        } else {
          return true;
        }
      } else {
        allowBlockCollections = false;
      }
    }
  }

  if (allowBlockCollections) {
    allowBlockCollections = atNewLine || allowCompact;
  }

  if (isIndented || c.CONTEXT_BLOCK_OUT === nodeContext) {
    if (c.CONTEXT_FLOW_IN === nodeContext || c.CONTEXT_FLOW_OUT === nodeContext) {
      flowIndent = parentIndent;
    } else {
      flowIndent = parentIndent + 1;
    }

    blockIndent = state.position - state.lineStart;

    if (isIndented) {
      if (allowBlockCollections &&
          (readBlockSequence(state, blockIndent) ||
           readBlockMapping(state, blockIndent)) ||
          readFlowCollection(state, flowIndent)) {
        hasContent = true;
      } else {
        if ((allowBlockScalars && readBlockScalar(state, flowIndent)) ||
            readSingleQuotedScalar(state, flowIndent) ||
            readDoubleQuotedScalar(state, flowIndent)) {
          hasContent = true;

        } else if (readAlias(state)) {
          hasContent = true;

          if (null !== state.tag || null !== state.anchor) {
            throwError(state, 'alias node should not have any properties');
          }

        } else if (readPlainScalar(state, flowIndent, c.CONTEXT_FLOW_IN === nodeContext)) {
          hasContent = true;

          if (null === state.tag) {
            state.tag = '?';
          }
        }

        if (null !== state.anchor) {
          state.anchorMap[state.anchor] = state.result;
        }
      }
    } else {
      hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
    }
  }

  if (null !== state.tag && '!' !== state.tag) {
    if ('?' === state.tag) {
      if (state.resolve) {
        for (typeIndex = 0, typeQuantity = state.implicitTypes.length;
             typeIndex < typeQuantity;
             typeIndex += 1) {
          type = state.implicitTypes[typeIndex];

          // Implicit resolving is not allowed for non-scalar types, and '?'
          // non-specific tag is only assigned to plain scalars. So, it isn't
          // needed to check for 'kind' conformity.

          if (type.loader.resolver(state, false)) { // `state.result` updated in resolver if matched
            state.tag = type.tag;
            break;
          }

        }
      }
    } else if (_hasOwnProperty.call(state.typeMap, state.tag)) {
      typeLoader = state.typeMap[state.tag].loader;

      if (null !== state.result && typeLoader.kind !== state.kind) {
        throwError(state, 'unacceptable node kind for !<' + state.tag + '> tag; it should be "' + typeLoader.kind + '", not "' + state.kind + '"');
      }

      if (typeLoader.resolver) {
        if (!typeLoader.resolver(state, true)) { // `state.result` updated in resolver if matched
          throwError(state, 'cannot resolve a node with !<' + state.tag + '> explicit tag');
        }
      }
    } else {
      throwWarning(state, 'unknown tag !<' + state.tag + '>');
    }
  }

  return null !== state.tag || null !== state.anchor || hasContent;
}

function readDocument(state, iterator) {
  var documentStart = state.position,
      _position,
      directiveName,
      directiveArgs,
      hasDirectives = false,
      c             = constant;

  state.version = null;
  state.checkLineBreaks = state.legacy;
  state.tagMap = {};
  state.anchorMap = {};

  while (state.position < state.length) {
    skipSeparationSpace(state, true, -1);

    if (state.lineIndent > 0 || c.CHAR_PERCENT !== state.character) {
      break;
    }

    hasDirectives = true;
    state.character = state.input.charCodeAt(++state.position);
    _position = state.position;

    while (state.position < state.length &&
           c.CHAR_SPACE           !== state.character &&
           c.CHAR_TAB             !== state.character &&
           c.CHAR_LINE_FEED       !== state.character &&
           c.CHAR_CARRIAGE_RETURN !== state.character) {
      state.character = state.input.charCodeAt(++state.position);
    }

    directiveName = state.input.slice(_position, state.position);
    directiveArgs = [];

    if (directiveName.length < 1) {
      throwError(state, 'directive name must not be less than one character in length');
    }

    while (state.position < state.length) {
      while (c.CHAR_SPACE === state.character || c.CHAR_TAB === state.character) {
        state.character = state.input.charCodeAt(++state.position);
      }

      if (c.CHAR_SHARP === state.character) {
        do { state.character = state.input.charCodeAt(++state.position); }
        while (state.position < state.length &&
               c.CHAR_LINE_FEED !== state.character &&
               c.CHAR_CARRIAGE_RETURN !== state.character);
        break;
      }

      if (c.CHAR_LINE_FEED === state.character || c.CHAR_CARRIAGE_RETURN === state.character) {
        break;
      }

      _position = state.position;

      while (state.position < state.length &&
             c.CHAR_SPACE           !== state.character &&
             c.CHAR_TAB             !== state.character &&
             c.CHAR_LINE_FEED       !== state.character &&
             c.CHAR_CARRIAGE_RETURN !== state.character) {
        state.character = state.input.charCodeAt(++state.position);
      }

      directiveArgs.push(state.input.slice(_position, state.position));
    }

    if (state.position < state.length) {
      readLineBreak(state);
    }

    if (_hasOwnProperty.call(directiveHandlers, directiveName)) {
      directiveHandlers[directiveName](state, directiveName, directiveArgs);
    } else {
      throwWarning(state, 'unknown document directive "' + directiveName + '"');
    }
  }

  skipSeparationSpace(state, true, -1);

  if (0 === state.lineIndent &&
      c.CHAR_MINUS === state.character &&
      c.CHAR_MINUS === state.input.charCodeAt(state.position + 1) &&
      c.CHAR_MINUS === state.input.charCodeAt(state.position + 2)) {
    state.position += 3;
    state.character = state.input.charCodeAt(state.position);
    skipSeparationSpace(state, true, -1);

  } else if (hasDirectives) {
    throwError(state, 'directives end mark is expected');
  }

  composeNode(state, state.lineIndent - 1, c.CONTEXT_BLOCK_OUT, false, true);
  skipSeparationSpace(state, true, -1);

  if (state.validate && state.checkLineBreaks &&
      PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
    throwWarning(state, 'non-ASCII line breaks are interpreted as content');
  }

  iterator(state.result);

  if (state.position === state.lineStart && testDocumentSeparator(state)) {
    if (c.CHAR_DOT === state.character) {
      state.position += 3;
      state.character = state.input.charCodeAt(state.position);
      skipSeparationSpace(state, true, -1);
    }
    return;
  }

  if (state.position < state.length) {
    throwError(state, 'end of the stream or a document separator is expected');
  } else {
    return;
  }
}



function loadAll(input, iterator, options) {
  var c = constant;

  options = options || {};

  var state = new State(input, options);

  if (state.validate && PATTERN_NON_PRINTABLE.test(state.input)) {
    throwError(state, 'the stream contains non-printable characters');
  }

  while (c.CHAR_SPACE === state.character) {
    state.lineIndent += 1;
    state.character = state.input.charCodeAt(++state.position);
  }

  while (state.position < state.length) {
    readDocument(state, iterator);
  }
}


function load(input, options) {
  var result = null, received = false;

  function iterator(data) {
    if (!received) {
      result = data;
      received = true;
    } else {
      throw new YAMLException('expected a single document in the stream, but found more');
    }
  }

  loadAll(input, iterator, options);

  return result;
}


function safeLoadAll(input, output, options) {
  loadAll(input, output, common.extend({ schema: DEFAULT_SAFE_SCHEMA }, options));
}


function safeLoad(input, options) {
  return load(input, common.extend({ schema: DEFAULT_SAFE_SCHEMA }, options));
}


module.exports.loadAll     = loadAll;
module.exports.load        = load;
module.exports.safeLoadAll = safeLoadAll;
module.exports.safeLoad    = safeLoad;
