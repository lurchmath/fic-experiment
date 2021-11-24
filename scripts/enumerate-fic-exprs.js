
const { LC, PreppedPropForm } = require( '../classes/all.js' )

// An expression has rank n if:
//  1. it is the nth propositional letter (a=0, b=1, c=2, etc.) or
//  2. it is { x y } where x,y are both rank n-1 and x!=y or
//  3. it is { :x y } under the same conditions.
// This function generates all expressions of rank n.
function* exprsOfRank ( n ) {
    yield 'abcdefghijklmnopqrstuvwxyz'.charAt( n )
    if ( n > 0 ) {
        for ( let lhs of exprsBelowRank( n ) ) {
            for ( let rhs of exprsBelowRank( n ) ) {
                if ( lhs != rhs ) { // remove trivialities
                    yield `{ ${lhs} ${rhs} }`
                    yield `{ :${lhs} ${rhs} }`
                }
            }
        }
    }
}
// Generate all expressions of rank <n, in the order rank 0 to rank n-1
function* exprsBelowRank ( n ) {
    for ( let i = 0 ; i < n ; i++ ) yield* exprsOfRank( i )
}
// Generate all expressions (an infinite generator--take care!)
// in order of rank 0, rank 1, rank 2, etc.
function* allExprs () {
    for ( let i = 0 ; true ; i++ ) yield* exprsOfRank( i )
}
// A segment of allExprs() starting at expr n and going to expr m-1,
// Like range() in Python, you can write someExprs(n) as shorthand for someExprs(0,n).
function* someExprs ( n, m ) {
    if ( typeof m == 'undefined' ) {
        yield* someExprs( 0, n )
        return
    }
    let counter = 0
    for ( let result of allExprs() ) {
        counter++
        if ( counter > n ) yield result
        if ( counter >= m ) return
    }
}

// Is the expression of the form { x y }?
const isAnd = lc => lc.children().length == 2 && lc.child(0).isAClaim
// Is the expression of the form { :x y }?
const isArrow = lc => lc.children().length == 2 && lc.child(0).isAGiven
// Is the text representation of an expression wrapped in an outer level of parens?
// (Can't just check if it starts with a paren because consider, f.ex., (a->b)->c.)
const isWrapped = text => {
    if ( text[0] != '(' ) return false
    let depth = 0
    for ( let i = 0 ; i < text.length ; i++ ) {
        if ( text[i] == '(' ) depth++
        if ( text[i] == ')' ) depth--
        if ( i < text.length - 1 && depth == 0 ) return false
    }
    return depth == 0
}
// Wrap the text in another layer of parens iff it doesn't have an outer one yet.
const wrapIfNeeded = text => isWrapped( text ) ? text : `(${text})`
// Write an implication/conjunction expression in standard notation (ASCII style).
// E.g., { x y } becomes x^y and { :x y } becomes x->y, with parens where needed.
// -> is right associative and ^ has higher precedence.
const inPropNotation = lc => {
    if ( lc.children().length == 0 ) return lc.toString()
    if ( lc.children().length != 2 ) throw 'Invalid # children'
    let lhs = inPropNotation( lc.child( 0 ) )
    let rhs = inPropNotation( lc.child( 1 ) )
    if ( lhs[0] == ':' ) lhs = lhs.substring( 1 )
    if ( rhs[0] == ':' ) rhs = rhs.substring( 1 )
    if ( isAnd( lc ) ) {
        if ( isArrow( lc.child( 0 ) ) ) lhs = wrapIfNeeded( lhs )
        if ( isArrow( lc.child( 1 ) ) ) rhs = wrapIfNeeded( rhs )
        return lhs + '^' + rhs
    }
    if ( isArrow( lc ) ) {
        if ( isArrow( lc.child( 0 ) ) ) lhs = wrapIfNeeded( lhs )
        return lhs + '->' + rhs
    }
    throw 'Invalid LC type'
}

// Global data storage for investigating tautology counts
// Will be initialized in collectDataAndReport(), below.
const counts = { }
// Output routines to make printing results easier
const lpad = ( text, width = 0 ) => ( text.length >= width ) ? text : lpad( ` ${text}`, width )
const rpad = ( text, width = 0 ) => ( text.length >= width ) ? text : rpad( `${text} `, width )
const round = ( n, digs ) => Math.round( n*Math.pow(10,digs) ) / Math.pow(10,digs)
const rpt = ( text, num, den ) =>
    console.log( rpad( text, 25 )
               + lpad( num, 10 ) + ' /' + lpad( den, 10 ) + '='
               + lpad( round( num*100/den, 4 ), 10 ) + '%' )
const report = header => {
    console.log()
    console.log( header )
    rpt( 'IPL tautologies', counts.ipl, counts.total )
    rpt( 'IPL non-tautologies', counts.total-counts.ipl, counts.total )
    rpt( 'CPL tautologies', counts.cpl, counts.total )
    rpt( 'CPL non-tautologies', counts.total-counts.cpl, counts.total )
    rpt( 'Different in IPL vs. CPL', counts.differences.length, counts.total )
    console.log()
    console.log( 'CPL tautologies that are not also IPL tautologies:' )
    counts.differences.forEach( d => console.log( '\t', inPropNotation( d ) ) )
    console.log()
}

// Loop through the given iterator, collect data on all its expressions, and report on it.
function collectDataAndReport ( iterator, description ) {
    console.log( `About to explore ${description}...` )
    counts.total = 0
    counts.ipl = 0
    counts.cpl = 0
    counts.differences = [ ]
    let i = 0
    for ( let x of iterator ) {
        const expr = LC.fromString( x )
        counts.total++
        if ( expr.children().length == 0 ) {
            // console.log( i, x, 'ATOMIC -- cannot be a tautology' )
        } else {
            try {
                const cpl = expr.CPLValidate()
                const ipl = expr.IPLValidate()
                if ( cpl ) counts.cpl++
                if ( ipl ) counts.ipl++
                if ( ipl == cpl ) {
                    // console.log( i, x, ipl, cpl )
                } else {
                    // console.log( i, x, ipl, cpl )
                    counts.differences.push( expr )
                    // console.log( lpad( inPropNotation( expr ), 30 ), 'is a CPL tautology but not an IPL tautology' )
                }
            } catch ( e ) {
                console.log( 'Error happened with this LC:', x )
                const ppfs = PreppedPropForm.createFrom( expr )
                ppfs.forEach( (ppf,ind) => console.log( ind, ppf.toString() ) )
                throw e
            }
        }
        if ( counts.total > 0 && counts.total % 10000 == 0 ) {
            console.log( 'Completed', counts.total )
            // console.log( 'Completed', counts.total, 'with these results so far:' )
            // console.log( '------------------------------------------------------------' )
            // report()
            // console.log()
        }
        i++
    }
    report( `After exploring ${description}:` )
}

// Choose what we're iterating over.  (Uncomment just one of these options.)

// /////////
// const topRank = 4
// const iterator = exprsBelowRank( topRank + 1 )
// collectDataAndReport( iterator, `all expressions up to rank ${topRank}` )

/////////
// All expressions until we've seen this many:
const numExprs = 100000
const iterator = someExprs( numExprs )
collectDataAndReport( iterator, `the first ${numExprs} expressions` )
