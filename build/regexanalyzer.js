/**
*
*   A simple Regular Expression Analyzer
*   @version 0.1
*   https://github.com/foo123/regex-analyzer
*
**/
(function(undef){
        
    // http://stackoverflow.com/questions/12376870/create-an-array-of-characters-from-specified-range
    var getCharRange = function(first, last) {
        var ch, chars, start = first.charCodeAt(0), end = last.charCodeAt(0);
        
        if ( end == start ) return [ String.fromCharCode( start ) ];
        
        chars = [];
        for (ch = start; ch <= end; ++ch)
            chars.push( String.fromCharCode( ch ) );
        
        return chars;
    };
        
    // A simple (js-flavored) regular expression analyzer
    var Analyzer = function( regex, delim ) {
        
        this.escapeChar = '\\';
        
        this.repeatsRegex = /^\{\s*(\d+)\s*,?\s*(\d+)?\s*\}/;
        
        this.unicodeRegex = /^u([0-9a-fA-F]{4})/;
        
        this.hexRegex = /^x([0-9a-fA-F]{2})/;
        
        this.specialChars = {
            "." : "MatchAnyChar",
            "|" : "MatchEither",
            "?" : "MatchZeroOrOne",
            "*" : "MatchZeroOrMore",
            "+" : "MatchOneOrMore",
            "^" : "MatchStart",
            "$" : "MatchEnd",
            "{" : "StartRepeats",
            "}" : "EndRepeats",
            "(" : "StartGroup",
            ")" : "EndGroup",
            "[" : "StartCharGroup",
            "]" : "EndCharGroup"
        };
        
        /*
            http://www.javascriptkit.com/javatutors/redev2.shtml
            
            \f matches form-feed.
            \r matches carriage return.
            \n matches linefeed.
            \t matches horizontal tab.
            \v matches vertical tab.
            \0 matches NUL character.
            [\b] matches backspace.
            \s matches whitespace (short for [\f\n\r\t\v\u00A0\u2028\u2029]).
            \S matches anything but a whitespace (short for [^\f\n\r\t\v\u00A0\u2028\u2029]).
            \w matches any alphanumerical character (word characters) including underscore (short for [a-zA-Z0-9_]).
            \W matches any non-word characters (short for [^a-zA-Z0-9_]).
            \d matches any digit (short for [0-9]).
            \D matches any non-digit (short for [^0-9]).
            \b matches a word boundary (the position between a word and a space).
            \B matches a non-word boundary (short for [^\b]).
            \cX matches a control character. E.g: \cm matches control-M.
            \xhh matches the character with two characters of hexadecimal code hh.
            \uhhhh matches the Unicode character with four characters of hexadecimal code hhhh.        
        */
        this.specialCharsEscaped = {
            "\\" : "EscapeChar",
            "/" : "/",
            "0" : "NULChar",
            "f" : "FormFeed",
            "n" : "LineFeed",
            "r" : "CarriageReturn",
            "t" : "HorizontalTab",
            "v" : "VerticalTab",
            "b" : "MatchWordBoundary",
            "B" : "MatchNonWordBoundary",
            "s" : "MatchSpaceChar",
            "S" : "MatchNonSpaceChar",
            "w" : "MatchWordChar",
            "W" : "MatchNonWordChar",
            "d" : "MatchDigitChar",
            "D" : "MatchNonDigitChar"
        };
        
        if ( regex )  this.setRegex(regex, delim);
    };
    
    Analyzer.VERSION = "0.1";
    Analyzer.getCharRange = getCharRange;
    
    Analyzer.prototype = {
        
        constructor : Analyzer,

        VERSION : Analyzer.VERSION,
        
        regex : null,
        pos : null,
        escaped : false,
        repeatsRegex : null,
        unicodeRegex : null,
        hexRegex : null,
        escapeChar : null,
        specialChars : null,
        specialCharsEscaped : null,
        flags : null,
        parts : null,

        getCharRange : Analyzer.getCharRange,
        
        setRegex : function(regex, delim) {
            if (regex)
            {
                this.flags = {};
                
                delim = delim || '/';
                var r = regex.toString(); 
                var l = r.length;
                var ch = r.charAt(l-1);
                
                // parse regex flags
                while ( delim != ch )
                {
                    this.flags[ ch ] = 1;
                    r = r.substr(0, l-1);
                    l = r.length;
                    ch = r.charAt(l-1);
                }
                // remove regex delimiters
                if ( delim == r.charAt(0) && delim == r.charAt(l-1) )  r = r.substr(1, l-2);
                
                this.regex = r;
            }
            return this;
        },
        
        analyze : function() {
            var ch, word = '', parts = [], flag, match;
            
            this.escaped = false;
            this.pos = 0;
            
            while ( this.pos < this.regex.length )
            {
                ch = this.regex.charAt( this.pos++ );
                
                //   \\abc
                this.escaped = (this.escapeChar == ch) ? true : false;
                if ( this.escaped )  ch = this.regex.charAt( this.pos++ );
                
                if ( this.escaped )
                {
                    // unicode character
                    if ( 'u' == ch )
                    {
                        if ( word.length )
                        {
                            parts.push( { part: word, flags: {}, type: "String" } );
                            word = '';
                        }
                        match = this.unicodeRegex.exec( this.regex.substr( this.pos-1 ) );
                        this.pos += match[0].length-1;
                        parts.push( { part: match[0], flags: { "Char": String.fromCharCode(parseInt(match[1], 16)), "Code": match[1] }, type: "UnicodeChar" } );
                    }
                    
                    // hex character
                    else if ( 'x' == ch )
                    {
                        if ( word.length )
                        {
                            parts.push( { part: word, flags: {}, type: "String" } );
                            word = '';
                        }
                        match = this.hexRegex.exec( this.regex.substr( this.pos-1 ) );
                        this.pos += match[0].length-1;
                        parts.push( { part: match[0], flags: { "Char": String.fromCharCode(parseInt(match[1], 16)), "Code": match[1] }, type: "HexChar" } );
                    }
                    
                    else if ( this.specialCharsEscaped[ch] )
                    {
                        if ( word.length )
                        {
                            parts.push( { part: word, flags: {}, type: "String" } );
                            word = '';
                        }
                        flag = {};
                        flag[ this.specialCharsEscaped[ch] ] = 1;
                        parts.push( { part: ch, flags: flag, type: "Special" } );
                    }
                    
                    else
                    {
                        word += ch;
                    }
                }
                
                else
                {
                    // parse character group
                    if ( '[' == ch )
                    {
                        if ( word.length )
                        {
                            parts.push( { part: word, flags: {}, type: "String" } );
                            word = '';
                        }
                        parts.push( this.chargroup() );
                    }
                    
                    // parse sub-group
                    else if ( '(' == ch )
                    {
                        if ( word.length )
                        {
                            parts.push( { part: word, flags: {}, type: "String" } );
                            word = '';
                        }
                        parts.push( this.subgroup() );
                    }
                    
                    // parse num repeats
                    else if ( '{' == ch )
                    {
                        if ( word.length )
                        {
                            parts.push( { part: word, flags: {}, type: "String" } );
                            word = '';
                        }
                        match = this.repeatsRegex.exec( this.regex.substr( this.pos-1 ) );
                        this.pos += match[0].length-1;
                        parts.push( { part: match[0], flags: { "MatchMinimum": match[1], "MatchMaximum": match[2] || "unlimited" }, type: "Special" } );
                    }
                    
                    // special characters like ^, $, +, ?, * etc..
                    else if ( this.specialChars[ch] )
                    {
                        if ( word.length )
                        {
                            parts.push( { part: word, flags: {}, type: "String" } );
                            word = '';
                        }
                        flag = {};
                        flag[ this.specialChars[ch] ] = 1;
                        parts.push( { part: ch, flags: flag, type: "Special" } );
                    }
                
                    else
                    {
                        word += ch;
                    }
                }
            }
            
            if ( word.length )
            {
                parts.push( { part: word, flags: {}, type: "String" } );
                word = '';
            }
            
            this.parts = parts;
            
            return this;
        },

        alternate : function() { },


        subgroup : function() {
            
            var ch, word = '', parts = [], flags = {}, flag, match;
            
            if ( "?:" == this.regex.substr(this.pos, 2) )
            {
                flags[ "NotCaptured" ] = 1;
                this.pos += 2;
            }
            
            else if ( "?=" == this.regex.substr(this.pos, 2) )
            {
                flags[ "LookAhead" ] = 1;
                this.pos += 2;
            }
            
            else if ( "?!" == this.regex.substr(this.pos, 2) )
            {
                flags[ "NegativeLookAhead" ] = 1;
                this.pos += 2;
            }
            
            while ( this.pos < this.regex.length )
            {
                ch = this.regex.charAt( this.pos++ );
                
                this.escaped = (this.escapeChar == ch) ? true : false;
                if ( this.escaped )  ch = this.regex.charAt( this.pos++ );
                
                if ( this.escaped )
                {
                    // unicode character
                    if ( 'u' == ch )
                    {
                        if ( word.length )
                        {
                            parts.push( { part: word, flags: {}, type: "String" } );
                            word = '';
                        }
                        match = this.unicodeRegex.exec( this.regex.substr( this.pos-1 ) );
                        this.pos += match[0].length-1;
                        parts.push( { part: match[0], flags: { "Char": String.fromCharCode(parseInt(match[1], 16)), "Code": match[1] }, type: "UnicodeChar" } );
                    }
                    
                    // hex character
                    else if ( 'x' == ch )
                    {
                        if ( word.length )
                        {
                            parts.push( { part: word, flags: {}, type: "String" } );
                            word = '';
                        }
                        match = this.hexRegex.exec( this.regex.substr( this.pos-1 ) );
                        this.pos += match[0].length-1;
                        parts.push( { part: match[0], flags: { "Char": String.fromCharCode(parseInt(match[1], 16)), "Code": match[1] }, type: "HexChar" } );
                    }
                    
                    else if ( this.specialCharsEscaped[ch] )
                    {
                        if ( word.length )
                        {
                            parts.push( { part: word, flags: {}, type: "String" } );
                            word = '';
                        }
                        flag = {};
                        flag[ this.specialCharsEscaped[ch] ] = 1;
                        parts.push( { part: ch, flags: flag, type: "Special" } );
                    }
                    
                    else
                    {
                        word += ch;
                    }
                }
                
                else
                {
                    // group end
                    if ( ')' == ch )
                    {
                        if ( word.length )
                        {
                            parts.push( { part: word, flags: {}, type: "String" } );
                            word = '';
                        }
                        return { part: parts, flags: flags, type: "Group" };
                    }
                    
                    // parse character group
                    else if ( '[' == ch )
                    {
                        if ( word.length )
                        {
                            parts.push( { part: word, flags: {}, type: "String" } );
                            word = '';
                        }
                        parts.push( this.chargroup() );
                    }
                    
                    // parse sub-group
                    else if ( '(' == ch )
                    {
                        if ( word.length )
                        {
                            parts.push( { part: word, flags: {}, type: "String" } );
                            word = '';
                        }
                        parts.push( this.subgroup() );
                    }
                    
                    // parse num repeats
                    else if ( '{' == ch )
                    {
                        if ( word.length )
                        {
                            parts.push( { part: word, flags: {}, type: "String" } );
                            word = '';
                        }
                        match = this.repeatsRegex.exec( this.regex.substr( this.pos-1 ) );
                        this.pos += match[0].length-1;
                        parts.push( { part: match[0], flags: { "MatchMinimum": match[1], "MatchMaximum": match[2] || "unlimited" }, type: "Special" } );
                    }
                    
                    // special characters like ^, $, +, ?, * etc..
                    else if ( this.specialChars[ch] )
                    {
                        if ( word.length )
                        {
                            parts.push( { part: word, flags: {}, type: "String" } );
                            word = '';
                        }
                        flag = {};
                        flag[ this.specialChars[ch] ] = 1;
                        parts.push( { part: ch, flags: flag, type: "Special" } );
                    }
                
                    else
                    {
                        word += ch;
                    }
                }
            }
            return { part: word, flags: flags, type: "Group" };
        },
        
        chargroup : function() {
            
            var parts = [], chars = [], flags = {}, flag, ch, prevch, range, isRange = false, match, isUnicode;
            
            if ( '^' == this.regex.charAt( this.pos ) )
            {
                flags[ "NotMatch" ] = 1;
                this.pos++;
            }
                    
            while ( this.pos < this.regex.length )
            {
                isUnicode = false;
                prevch = ch;
                ch = this.regex.charAt( this.pos++ );
                
                this.escaped = (this.escapeChar == ch) ? true : false;
                if ( this.escaped )  ch = this.regex.charAt( this.pos++ );
                
                if ( this.escaped )
                {
                    // unicode character
                    if ( 'u' == ch )
                    {
                        match = this.unicodeRegex.exec( this.regex.substr( this.pos-1 ) );
                        this.pos += match[0].length-1;
                        ch = String.fromCharCode(parseInt(match[1], 16));
                        isUnicode = true;
                    }
                    
                    // hex character
                    else if ( 'x' == ch )
                    {
                        match = this.hexRegex.exec( this.regex.substr( this.pos-1 ) );
                        this.pos += match[0].length-1;
                        ch = String.fromCharCode(parseInt(match[1], 16));
                        isUnicode = true;
                    }
                }
                
                if ( isRange )
                {
                    if ( chars.length )
                    {
                        parts.push( { part: chars, flags: {}, type: "Chars" } );
                        chars = [];
                    }
                    range[1] = ch;
                    isRange = false;
                    parts.push( { part: range, flags: {}, type: "CharRange" } );
                }
                else
                {
                    if ( this.escaped )
                    {
                        if ( !isUnicode && this.specialCharsEscaped[ch] )
                        {
                            if ( chars.length )
                            {
                                parts.push( { part: chars, flags: {}, type: "Chars" } );
                                chars = [];
                            }
                            flag = {};
                            flag[ this.specialCharsEscaped[ch] ] = 1;
                            parts.push( { part: ch, flags: flag, type: "Special" } );
                        }
                        
                        else
                        {
                            chars.push( ch );
                        }
                    }
                    
                    else
                    {
                        // end of char group
                        if ( ']' == ch )
                        {
                            if ( chars.length )
                            {
                                parts.push( { part: chars, flags: {}, type: "Chars" } );
                                chars = [];
                            }
                            return { part: parts, flags: flags, type: "CharGroup" };
                        }
                        
                        else if ( '-' == ch )
                        {
                            range = [prevch, ''];
                            chars.pop();
                            isRange = true;
                        }
                        
                        else
                        {
                            chars.push( ch );
                        }
                    }
                }
            }
            if ( chars.length )
            {
                parts.push( { part: chars, flags: {}, type: "Chars" } );
                chars = [];
            }
            return { part: chars, flags: flags, type: "CharGroup" };
        }
    };
        
    // export it
    if ('undefined' != typeof (module) && module.exports)  module.exports = Analyzer;
    
    else if ('undefined' != typeof (exports)) exports = Analyzer;
    
    else this.RegExAnalyzer = Analyzer;
    
}).call(this);