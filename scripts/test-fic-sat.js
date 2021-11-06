
const { satSolve } = require( '../dependencies/LSAT.js' )
const all = require( '../classes/all.js' )
const LC = all.LC

//
// An instanceof the PreppedPropForm class is a propositional sentence that has
// been prepared/processed to be maximally efficient when used for FIC checking.
//
class PreppedPropForm {
    // Three ways to construct:
    // new PreppedPropForm(parity,catalog) == constant true
    // new PreppedPropForm(parity,catalog,A) == propositional letter
    //   (A must be a string containing its name)
    // new PreppedPropForm(A,B) == conditional expression
    //   (A and B must both be PreppedPropForm instances)
    constructor ( ...args ) {
        if ( args[0] === true || args[0] === false ) {
            if ( args.length == 2 ) {
                // constant true
                this.text = 'True'
                this.parity = args[0]
                this.catalog = args[1]
                this.cnf = this.parity ? [ ] : [ [ ] ]
                this.children = [ ]
            } else {
                // propositional letter
                this.text = args[2]
                this.parity = args[0]
                this.catalog = args[1]
                this.cnf = [ [ this.catalogNumber( this.text, this.catalog )
                             * ( this.parity ? 1 : -1 ) ] ]
                this.children = [ ]
            }
        } else {
            // conditional expression
            if ( !( args[0] instanceof PreppedPropForm )
              || !( args[1] instanceof PreppedPropForm ) )
                throw 'Invalid argument types to PreppedPropForm constructor'
            if ( args[0].parity == args[1].parity )
                throw 'Cannot make a conditional with the same parity in both children'
            this.text = `[${args[0].text},${args[1].text}]`
            this.parity = args[1].parity
            this.catalog = args[0].catalog
            this.cnf = this.parity ? args[0].disjoinedWith( args[1] ) :
                                     args[0].cnf.concat( args[1].cnf )
            this.children = args
        }
    }
    // Disjoin the CNF of this instance with that of another, using switch
    // variables to do so efficiently.  Note: This returns just the new CNF,
    // not a PreppedPropForm instance.
    disjoinedWith ( other ) {
        if ( this.cnf.length == 1 )
            return other.cnf.map( conjunct =>
                Array.from( new Set( this.cnf[0].concat( conjunct ) ) ) )
        if ( other.cnf.length == 1 )
            return this.cnf.map( conjunct =>
                Array.from( new Set( other.cnf[0].concat( conjunct ) ) ) )
        if ( this.cnf.length == 2 && other.cnf.length == 2 )
            return [ this.cnf[0].concat( other.cnf[0] ),
                     this.cnf[1].concat( other.cnf[0] ),
                     this.cnf[0].concat( other.cnf[1] ),
                     this.cnf[1].concat( other.cnf[1] ) ]
        const maxSwitchVar = this.catalog.filter( x => /^switch[0-9]+$/.test( x ) )
                                         .map( x => parseInt( x.substring( 6 ) ) )
                                         .reduce( Math.max, -1 )
        const newSwitchVar = `switch${maxSwitchVar+1}`
        index = this.catalogNumber( newSwitchVar, catalog )
        return [ ...this.cnf.map( conjunct => conjunct.concat( [ newSwitchVar ] ) ),
                 ...other.cnf.map( conjunct => conjunct.concat( [ -newSwitchVar ] ) ) ]
    }
    // Get the catalog number for a given atomic propositional letter.
    // (If it's not already in our catalog, add it, then return the new number.)
    catalogNumber ( letter ) {
        let index = this.catalog.indexOf( letter )
        if ( index == -1 ) {
            index = this.catalog.length
            this.catalog.push( letter )
        }
        return index + 1
    }
    // Is this atomic (either the constant true or a propositional letter)?
    isAtomic () { return this.children.length == 0 }
    // Is this conditional (the only non-atomic option)?
    isConditional () { return this.children.length > 0 }
    // Is an instance equal to this one in the given array?
    isIn ( array ) { return array.some( x => x.text == this.text ) }
    // The given array, with this object added, if needed.
    // The append parameter says whether to put it on the front or the end.
    addedTo ( array, append ) {
        return this.isIn( array ) ? array :
               append             ? array.concat( [ this ] )
                                  : [ this ].concat( array )
    }
    // Check whether this is a tautology.  Works only if its parity is negative.
    // It's a tautology iff the CNF of its negation passes SAT.
    isAClassicalTautology () {
        if ( this.parity )
            throw 'Cannot check if an object with positive parity is a tautology'
        return !satSolve( this.catalog.length, this.cnf )
    }
    // Check whether this follows from the given premises.  Works only if its
    // parity is negative and all the premises' parities are positive, for the
    // same reason as above.  The premises must have been constructed with the
    // same catalog as this object.
    followsClassicallyFrom ( ...premises ) {
        if ( this.parity || premises.some( p => !p.parity ) )
            throw 'Invalid parity/parities in the sequent to check'
        if ( premises.some( p => p.catalog != this.catalog ) )
            throw 'Can check deduction only if all catalogs are the same'
        const cnf = premises.map( p => p.cnf )
                            .reduce( (a,b) => a.concat( b ), [ ] )
                            .concat( this.cnf )
        return !satSolve( this.catalog.length, cnf )
    }
    // Create an array of PreppedPropForm instances from a given LC.
    // The conjunction of the result is IPL-equivalent to the given LC.
    // The final argument is typically not used by clients, but just in recursion.
    static createFrom ( lc, parity = false, catalog = [ ], index = 0 ) {

        // Base case 1: atomic
        if ( lc.isAnActualStatement() || lc.isAnActualDeclaration() )
            return [ new PreppedPropForm( parity, catalog,
                lc.toString().replace( /:/g, '' ) ) ]

        // To proceed, we need to know where the final *claim* child is indexed.
        const chi = lc.children()
        let lastClaimIndex = chi.length - 1
        while ( lastClaimIndex >= 0 && chi[lastClaimIndex].isAGiven )
            lastClaimIndex--

        // Base case 2: no claims left
        if ( index > lastClaimIndex )
            return [ new PreppedPropForm( parity, catalog ) ]

        // Inductive case 1: one claim left
        if ( index == lastClaimIndex )
            return PreppedPropForm.createFrom( chi[index], parity, catalog, 0 )

        // Inductive case 2: conjunction
        // chi[index] is a claim, so the env from chi[index] onwards is interpreted
        // as chi[index] ^ the rest.
        // No need to form any new CNFs because we are just concatenating arrays of
        // conditionals, not forming a containing expression for them.
        if ( chi[index].isAClaim ) {
            const first = PreppedPropForm.createFrom( chi[index], parity, catalog, 0 )
            const rest = PreppedPropForm.createFrom( lc, parity, catalog, index+1 )
            return first.concat( rest )
        }

        // Inductive case 3: conditional
        // chi[index] is a given, so the env from chi[index] onwards is interpreted
        // as chi[0] -> the rest.
        // For each result R in the recursive computation of the rest, form a new
        // result chi[0] -> R, except with chi[0] turned into a chain of arrows
        // based on a recursive call.
        const first = PreppedPropForm.createFrom( chi[index], !parity, catalog, 0 )
        const rest = PreppedPropForm.createFrom( lc, parity, catalog, index+1 )
        return rest.map( conclusion => {
            for ( let i = first.length - 1 ; i >= 0 ; i-- )
                conclusion = new PreppedPropForm( first[i], conclusion )
            return conclusion
        } )

    }
}

//
// Here we extend the LC class with two functions that can be used for fast FIC
// validation.  The first, shown immediately below, is a static helper function
// and the second, which follows it, is the one clients will actually call to
// validate an LC.
//
LC._FIChelper = function (
    atomics, arrows, C,
    stop = arrows.length, useSAT = true, known = new Set()
    //, indent = 0
) {
   // if ( indent > 10 ) throw 'uh-oh'
    // let tab = ''; while ( tab.length < 4*indent ) tab += ' '
    // dbg( tab, 'FIC:', atomics.map( a => a.text ), arrows.map( a => a.text ),
    //     '|-', C.text, `  @${stop}` )

    // don't bother with FIC if SAT says no...
    // ...unless the caller told us not to do this check.
    // (Recursive calls that already know the check will pass may tell us to
    // skip it to save time.)
    if ( useSAT ) {
        if ( !C.followsClassicallyFrom( ...atomics, ...arrows ) ) {
            // dbg( tab, 'SAT SAID STOP!' )
            return false
        }
    }

    // If the conclusion is already known, just stop now.
    if ( known.has( C.text ) ) {
        // dbg( tab, 'already proven elsewhere:', C.text )
        return true
    }

    // apply the GR rule as many times as needed to achieve an atomic RHS
    while ( C.isConditional() ) {
        const A = C.children[0]
        if ( A.isAtomic() ) {
            atomics = A.addedTo( atomics )
        } else {
            arrows = A.addedTo( arrows, false ) // false == prepend, not append
            stop++
        }
        C = C.children[1]
    }

    // dbg( tab, 'reduced:', atomics.map( a => a.text ), arrows.map( a => a.text ),
    //     '|-', C.text, `  @${stop}` )

    // C is now atomic.  if the S rule applies, done
    if ( C.isIn( atomics ) ) {
        // dbg( tab, 'yes--S' )
        return true
    }

    // recursive applications of GL rule
    const provenInRecursion = new Set()
    for ( let i = 0 ; i < arrows.length ; i++ ) {
        if ( i >= stop ) break
        // dbg( tab, `consider ${i}. `, arrows[i].text )
        const Ai = arrows[i].children[0] // Ai in Ai->Bi
        const Bi = arrows[i].children[1] // Bi in Ai->Bi
        const provenInThisRecursion = new Set()
        if ( !LC._FIChelper( atomics, arrows.without( i ), Ai, i, true,
                             provenInThisRecursion/*, indent+1*/ ) ) {
            Array.from( provenInThisRecursion ).forEach(
                proven => provenInRecursion.add( proven ) )
            continue
        }
        // dbg( tab, 'can prove LHS, so now try using the RHS:' )
        let arCopy = arrows.without( i )
        if ( Bi.isAtomic() ) {
            return LC._FIChelper(
                Bi.addedTo( atomics ), arCopy, C,
                arrows.length, false, provenInRecursion/*, indent+1*/ )
        } else {
            return LC._FIChelper(
                atomics, Bi.addedTo( arCopy ), C,
                arrows.length, false, provenInRecursion/*, indent+1*/ )
        }
    }

    // dbg( tab, 'failed to prove:', atomics.map( a => a.text ),
    //     arrows.map( a => a.text ), '|-', C.text, `  @${stop}` )
    return false
}
LC.prototype.FICValidate = function () {
    const prepped = PreppedPropForm.createFrom( this, false )
    return prepped.every( conclusion => LC._FIChelper( [], [], conclusion ) )
}

//
// Now let's test and time the routines written above:
//
const many = [
    LC.fromString( '{ :{ :a b :{ :c d e } f g } { :a :d :e g } }' ), true,
    LC.fromString( '{ :{ :a b :{ :c d e } f g } { :a :d e g } }' ), false,
    LC.fromString( '{ :{ :a b :{ :c d e } f g } { :a d e g } }' ), false
]
const time = ( validator, repeats ) => {
    const start = new Date
    for ( let i = 0 ; i < repeats ; i++ ) {
        for ( let j = 0 ; j < many.length - 1 ; j += 2 ) {
            const result = validator( many[j] )
            if ( result != many[j+1] )
                throw `Error:\n\tRan: ${validator}\n\tOn: ${many[j]}\n\tWrong answer: ${result}\n\tShould be: ${many[j+1]}`
        }
    }
    return new Date - start
}
const compare = repeats => {
    console.log( `Running ${repeats} FIC calls...` )
    const ficTime = time( x => x.FICValidate(), repeats )
    console.log( `\tTook ${ficTime}ms` )
    console.log( `Running ${repeats} SAT calls...` )
    const satTime = time( x => x.Validate(), repeats )
    console.log( `\tTook ${satTime}ms` )
    console.log( `Ratio: ${ficTime/satTime}` )
}
compare( 10000 )
