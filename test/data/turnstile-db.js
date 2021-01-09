
// This module creates a giant list of all the Turnstiles we've tested
// elsewhere, as a big database we can use for other work.

const { LC } = require( '../../classes/lc.js' )
const { Turnstile } = require( '../../classes/deduction.js' )

// internal

// initially the database is empty; we will add to it later
let DB = [ ]

// external

// for clients: how many entries are in the DB?
const size = () => DB.length

// for clients: get entry i from the DB
// (the object must be a TurnstileTest instance, defined later in this file)
const getTest = i => DB[i]

// for clients: change entry i in the DB to the new test object given here
const setTest = ( i, test ) => DB[i] = test

// what does it mean for two turnstiles to be the same, for the purposes of
// this database?  it means exact structural equality, left and right sides,
// in the same order, so that our database has lots of different tests.
// (if we treated the LHSs as sets, then we wouldn't have as big a set of
// tests, and wouldn't be verifying that turnstiles *treat* their LHS as sets.)
const sameTurnstiles = ( t1, t2 ) => {
    if ( t1.premises.length != t2.premises.length
      || !t1.conclusion.equals( t2.conclusion ) ) return false
    for ( let i = 0 ; i < t1.length ; i++ )
        if ( !t1.premises[i].equals( t2.premises[i] ) ) return false
    return true
}

// for clients: append a new TurnstileTest instance to the DB
// (unless an identical one is already there)
// also ensure that its metadata says whether it uses metavariables or not
const addTest = test => {
    if ( DB.some( oldTest =>
         sameTurnstiles( oldTest.turnstile, test.turnstile ) ) ) return
    test.metadata.containsMetavariables = test.turnstile.premises.some( p =>
        p.hasDescendantSatisfying( d => d.isAMetavariable ) ) ||
        test.turnstile.conclusion.hasDescendantSatisfying( d => d.isAMetavariable )
    DB.push( test )
}

// the class for all objects in the database
class TurnstileTest {
    constructor ( turnstile, result, metadata = { } ) {
        this.setTurnstile ( turnstile )
        this.setResult( result )
        this.setMetadata( metadata )
    }
    setAttribute ( key, value ) { this.metadata[key] = value }
    getAttribute ( key ) { return this.metadata[key] }
    setMetadata ( obj ) { this.metadata = obj }
    getMetadata () { return this.metadata }
    setTurnstile ( t ) { this.turnstile = t }
    getTurnstile () { return this.turnstile }
    setResult ( bool ) { this.result = bool }
    getResult () { return this.result }
}

module.exports = {
    size, getTest, setTest, addTest, TurnstileTest, Turnstile, LC
}

// convenience functions for internal use
const makeExpr = e => typeof( e ) == 'string' ? LC.fromString( e ) : e
const markMetavars = e => {
    if ( e.identifier && e.identifier[0] == '_' &&
         e.identifier[e.identifier.length-1] == '_' ) {
        e.identifier = e.identifier.substring( 1, e.identifier.length - 1 )
        e.isAMetavariable = true
    }
    e.children().map( markMetavars )
    return e
}
const fix = x => markMetavars( makeExpr( x ) )
const add = ( ...args ) => {
    let result
    let metadata = args.pop()
    if ( typeof( metadata ) == 'boolean' ) {
        result = metadata
        metadata = { }
    } else {
        result = args.pop()
    }
    let conclusion = fix( args.pop() )
    let premises = args.map( fix )
    addTest(
        new TurnstileTest(
            new Turnstile( premises, conclusion ),
            result,
            metadata
        )
    )
}

// these come from /test/fic-derivations.js
add( '{ }', true, { category: 'T rule' } )
add( '{ A B }', '{ }', true, { category: 'T rule' } )
add( '_A_(_B_,_C_)', 'not(a,metavar)', '{ }', true, { category: 'T rule' } )
add( 'a', 'a', true, { category: 'S rule' } )
add( '_a_', 'a', true, { category: 'S rule' } )
add( '_X_', 'a', true, { category: 'S rule' } )
add( '_X_', '_Y_', 'A', true, { category: 'S rule' } )
add( '_X_(_Y_)', 'a', false )
add( '{ :A A }', true, { category: 'GR rule' } )
add( '{ :_X_ A }', true, { category: 'GR rule' } )
add( '{ :_X_ { :_Y_ A } }', true, { category: 'GR rule' } )
add( 'A', '{ A A }', true, { category: 'CR rule' } )
add( '_X_', '{ A A }', true, { category: 'CR rule' } )
add( '_X_', '_Y_', '{ A B }', true, { category: 'CR rule' } )
add( '_X_', '_X_', '{ A B }', false, { category: 'CR rule' } )
add( 'Let{ x P }', 'Let{ x P }', true, { category: 'LI rule' } )
add( 'Declare{ x P }', 'Declare{ x P }', true, { category: 'DI rule' } )
add( 'Let{ _x_ _P_ }', 'Let{ y Q }', true, { category: 'LI rule' } )
add( 'Declare{ _x_ _P_ }', 'Declare{ y Q }', true, { category: 'DI rule' } )
add( 'Let{ a _P_(a) }', 'Let{ a Q(a) }', true, { category: 'LI rule' } )
add( 'Declare{ a _P_(a) }', 'Declare{ a Q(a) }', true, { category: 'DI rule' } )
add( 'Let{ _X_ _Y_ P(_X_,_Y_) }',
     'Let{ a b P(a,b) }', true, { category: 'LI rule' } )
add( 'Declare{ _X_ _Y_ P(_X_,_Y_) }',
     'Declare{ a b P(a,b) }', true, { category: 'DI rule' } )
add( 'Let{ a and(_P_,_P_) }',
     'Let{ a and(Q,R) }', false, { category: 'LI rule' } )
add( 'Declare{ a and(_P_,_P_) }',
     'Declare{ a and(Q,R) }', false, { category: 'DI rule' } )
add( '{ :R Q }', 'R', 'Q', true, { category: 'GL rule' } )
add( '{ :_P_ Q }', 'R', 'Q', true, { category: 'GL rule' } )
add( '{ :_P1_ _P2_ }', 'R', 'Q', true, { category: 'GL rule' } )
add( '{ R Q }', 'R', true, { category: 'CL rule' } )
add( '{ R Q }', 'Q', true, { category: 'CL rule' } )
add( '{ _A_ B }', 'R', true, { category: 'CL rule' } )
add( '{ _A_ _B_(x) }', 'Q(x)', true, { category: 'CL rule' } )
add( '_X_', '{ :{ } A }', true )
add( '_P_', 'Let{ _x_ _P_(_x_) }', '{ Let{ z Q(z) } Q }', true )
add( '{ :P(_X_) P(S(_X_)) }', 'Let{ _x_ P(S(_x_)) }', 'Let{ t P(S(t)) }', true )
add( '{ _A_ _B_ }', '{ }', true )
add( '{ :imp(_A_,_B_) { :_A_ _B_ } }', 'imp(P,Q)', 'P', 'Q', true )
add( '{ :or(_A_,_B_) :imp(_A_,_C_) :imp(_B_,_C_) _C_ }',
     'imp(yo,dude)', 'imp(hey,dude)', 'or(hey,yo)', 'dude', true )
add( 'or(a,and(b,c))', 'not(a)',
     '{ :or(_X1_,_Y1_) :not(_X1_) _Y1_ }',
     '{ :and(_X2_,_Y2_) _X2_ }', 'b', true )
add( '{ :and(_A_,_B_) and(_B_,_A_) }', '{ :and(_C_,_D_) _C_ }', 'and(x,y)', 'y',
     true )
add( '{ :foo(_A_) bar(_A_,_B_) }', '{ :bar(_C_,_D_) baz(_D_) }', 'foo(x)',
     'baz(y)', false )

// convenience function for adding sets of tests
const addMany = ( expr, ...results ) => {
    let metadata = { }
    if ( typeof( results[results.length-1] ) != 'boolean' )
        metadata = results.pop()
    expr = fix( expr )
    const concls = expr.conclusions()
    if ( concls.length != results.length )
        throw `Expected ${concls.length} results, not ${results.length}`
    for ( let c of concls ) {
        const acc = c.allAccessibles().map( x => x.claim() )
        add( ...acc, c, results.shift(), metadata )
    }
}

// these come from /test/validation.js
addMany( '{ :A A }', true, { category: 'extracted' } )
addMany( '{ :{ :A B } :A B }', true, { category: 'extracted' } )
addMany( '{ :{ :A B } :{ :B C } { :A C } }', true, { category: 'extracted' } )
addMany( '{ :{ :A B } { :{ :B C } :A C } }', true, { category: 'extracted' } )
addMany( '{ A B }', false, false, { category: 'extracted' } )
addMany( '{ A A }', false, true, { category: 'extracted' } )
addMany( '{ A { :B A } }', false, true, { category: 'extracted' } )
addMany( '{ A { A B } B }', false, true, false, true, { category: 'extracted' } )
addMany( '{ A { :A B } B }', false, false, true, { category: 'extracted' } )
addMany( '{ :C { :A B } B }', false, false, { category: 'extracted' } )
addMany( '{ :{ :{ A B } and(A,B) }'
       + '   :{ :and(A,B) A B }   '
       + '   :B                   '
       + '   :C                   '
       + '   :A                   '
       + '   B                    '
       + '   and(A,B)             '
       + '   A                    '
       + '}', true, true, true )
addMany( '{               '
       + '  :{ :or(P,Q)   '
       + '     :{ :P R }  '
       + '     :{ :Q R }  '
       + '     R          '
       + '  }             '
       + '  :{ :Q W R }   '
       + '  :{ :P S R U } '
       + '  :or(W,U)      '
       + '  :or(P,Q)      '
       + '  R             '
       + '}               ', true )
addMany( '{               '
       + '  :{ :or(P,Q)   '
       + '     :{ :P R }  '
       + '     :{ :Q R }  '
       + '     R          '
       + '  }             '
       + '  { :Q W R }   '
       + '  :{ :P S R U } '
       + '  or(W,U)       '
       + '  :or(P,Q)      '
       + '  R             '
       + '}               ', false, false, false, true )
const D = LC.fromString('Declare{ s t P(s,t) }')
const Pst = LC.fromString('P(s,t)')
const L = LC.fromString('Let{ s t { W P(s,t) H } }')
const X = LC.fromString('Let{ x x }')
const divalg= '{                       '
            + '  :{ :in(a,N) :in(b,N)  '
            + '     Declare{ q r       '
            + '       { f(a,b,q,r)     '
            + '         g(b,r)         '
            + '         { :h(a,b,c,d)  '
            + '           eq(c,q)      '
            + '           eq(d,r)      '
            + '         }              '
            + '       }                '
            + '     }                  '
            + '   }                    '
            + '  :in(b,N)              '
            + '  :in(a,N)              '
            + '  Declare{ q r          '
            + '    { :h(a,b,c,d)       '
            + '      eq(d,r)           '
            + '    }                   '
            + '  }                     '
            + '}                       '
const DA = LC.fromString(divalg)
add( D, D, true, { category: 'Declarations' } )
add( D, L, D, true, { category: 'Declarations' } )
add( D, L, L, true, { category: 'Declarations' } )
add( D, L, false, { category: 'Declarations' } )
add( L, D, false, { category: 'Declarations' } )
add( D, Pst, true, { category: 'Declarations' } )
add( Pst, D, false, { category: 'Declarations' } )
add( L, Pst, true, { category: 'Declarations' } )
add( Pst, L, false, { category: 'Declarations' } )
add( Pst, false, { category: 'Declarations' } )
add( L, false, { category: 'Declarations' } )
add( X, false, { category: 'Declarations' } )
add( DA, true, { category: 'Declarations' } )
addMany( '{ Let{ x x } }', false, { category: 'Declarations' } )
addMany( '{ Declare{ s t P(s,t) } }', false, { category: 'Declarations' } )
addMany( '{ :Declare{ s t P(s,t) } P(s,t) }', true,
         { category: 'Declarations' } )
addMany( '{ Declare{ s t P(s,t) } P(s,t) }', false, true,
         { category: 'Declarations' } )
addMany( '{ Let{ s P } Let{ t Q } Let{ s Q } }', false, false, false,
         { category: 'Declarations' } )
addMany( '{ Let{ s P } Let{ t Q } Let{ s P } Declare{ t Q } }',
         false, false, true, false, { category: 'Declarations' } )
addMany( '{ :Let{ s P } :Let{ t Q } Let{ t Q } Let{ s P } }', true, true,
         { category: 'Declarations' } )
addMany( '{ P Declare{ s { :P Q(s) } } Q(s) }', false, false, true,
         { category: 'Declarations' } )
addMany( '{ :Let{ x y { :P W(y) Q(x,y) Z(x) } } :P Q(x,y) }', true,
         { category: 'Declarations' } )
addMany( '{ :Declare{ x { :P W(x) Z(x) } } :P Declare{ x W(x) } }', false,
         { category: 'Declarations' } )
addMany( '{ :Declare{ x { :P W(x) Z(x) } } :P Declare{ x { :P W(x) } } W(x) }',
         true, true, { category: 'Declarations' } )
addMany( '{ :{ :P W(x) Z(x) } :P Declare{ x W(x) } }', false,
         { category: 'Declarations' } )
addMany( '{ :P W(x) Z(x) Declare{ x W(x) } }', false, false, false,
         { category: 'Declarations' } )
addMany( '{ { W(x) Z(x) } Declare{ y W(x) } }', false, false, false,
         { category: 'Declarations' } )
addMany( DA, true, { category: 'Declarations' } )
addMany( '{ :{ :{ :Let{ x W(x) } Z(x) } ~All(x,implies(W(x),Z(x))) } '
       + '{ :Let{ x W(x) } Z(x) } ~All(x,implies(W(x),Z(x))) }',
         false, true, { category: 'Declarations' } )
