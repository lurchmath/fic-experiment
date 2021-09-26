
// Tests conversion to cnf and SAT validation

// import expect.js
let expect = require( 'expect.js' )

// import all classes defined in this repo
const { OM, Structure, LC, Statement, Environment }
      = require( '../classes/all.js' )
const { Proofstr } = require( './data/PropProofs.js' )
const { AllofLurchstr } = require( './data/AllofLurch.js' )
const { EvenMoreLurchstr } = require( './data/EvenMoreLurch.js' )

let lc = (s) => LC.fromString(s)
// pretty print a cnf
let show = (A) => {
  if ( A === undefined ) { return undefined }
  let a = A.map( x => Array.from(x) )
  let ans = '[ '
  a.forEach( x => ans += '{'+x.toString()+'} ')
  return ans+']'
}
let lctest = (lcs,checkvalid=true) =>
   (checkvalid) ?
     test( `We can Validate ${lcs}`, () => {
        expect( lc(lcs).Validate() ).to.be.ok() } ) :
     test( `We can check that ${lcs} is not valid`, () => {
        expect( lc(lcs).Validate() ).not.to.be.ok() } )
// utility: convert lcstring to an lc, compute it's cnf, then check if it equals
// the cnf (as a cnf) created by passing clauses as arrays to makecnf
// Passing only one argument (the lcstring) checks if the cnf if undefined.
let cnftest = (lcstring,...clauses) =>
     (lc(lcstring).cnf()) ?
       test( `the cnf of ${lcstring} is ${show(makecnf(...clauses))}`, () => {
          expect( equalcnf(lc(lcstring).cnf(),makecnf(...clauses)) ).to.be.ok()
       } ) :
       test( `the cnf of ${lcstring} is undefined`, () => {
          expect(lc(lcstring).cnf()).to.be(undefined)
       } )

suite( 'Validate conversion to cnf that should return empty.', () => {
  cnftest('{ }')
  cnftest('{ :A }')
  cnftest('{ :A :A }')
  cnftest('{ :A :B }')
  cnftest('{ :{ A } }')
  cnftest('{ :{ A B } }')
  cnftest('{ :{ A B } :C }')
  cnftest('{ :C :{ A B } }')
  cnftest('{ :{ A B } :{ C D }}')
  cnftest('{ :{ :A B } :{ C :D }}')
  cnftest('{ { :A :B } { :C :D }}')
  cnftest('{ { :A :{ :B C } } }')
  cnftest('{ { :A { :B :C } } }')
  cnftest('{ { :A { :B { :C :D} } } }')
  cnftest('{ { :{ A B } { :C :D} } }')
  cnftest(':{ }')
  cnftest(':{ :A }')
  cnftest(':{ :A :A }')
  cnftest(':{ :A :B }')
  cnftest(':{ :{ A } }')
  cnftest(':{ :{ A B } }')
  cnftest(':{ :{ A B } :C }')
  cnftest(':{ :C :{ A B } }')
  cnftest(':{ :{ A B } :{ C D }}')
  cnftest(':{ :{ :A B } :{ C :D }}')
  cnftest(':{ { :A :B } { :C :D }}')
  cnftest(':{ { :A :{ :B C } } }')
  cnftest(':{ { :A { :B :C } } }')
  cnftest(':{ { :A { :B { :C :D} } } }')
  cnftest('{ { :{ A B } { :C :D} } }')
} )

suite( 'Validate conversion to nontrivial cnf of simple LCs.', () => {
  cnftest('A',['A'])
  cnftest(':A',[':A'])
  cnftest('{ A }',['A'])
  cnftest('{ A B }',['A'],['B'])
  cnftest('{ A B }',['B'],['A'])
  cnftest('{ :A B }',[':A','B'])
  cnftest('{ :A B }',['B',':A'])
  cnftest('{ :A :B C }',[':A',':B','C'])
  cnftest('{ :A :B C }',[':A',':B','C'],['C',':A',':B',':B'])
  cnftest('{ :A :B C D }',[':A',':B','C'],[':B',':A','D'])
  cnftest('{ :{ :A B } B }',['A','B'],[':B','B'])
  cnftest('{ :{ :A B } :A B }',['A',':A','B'],[':B',':A','B'])
  cnftest(':{ :{ :A B } B }',[':A','B'],[':B'])
  // Shunting
  cnftest('{ :{ :A { :B C } } { :A :B C } }',['A',':A',':B','C'],['B',':A',':B','C'],[':C',':A',':B','C'])
  // SimpleSwitch: Note - this will need to be updated when we pick
  // permanent names for switch variables
  cnftest('{:{:{:A B} {:A C}} {:{:B C} C}}',[':A','B','Z1'],['A','Z1'],[':C','Z1'],['B','C',':Z1'],[':C','C',':Z1'])
} )

suite( 'Validate some short LCs and check accessibility.', () => {

  let Contrapositive = lc(`
       {
         :{:{:A B} C}
         :{:{:D E} B}
         :{:{:F G} E}
         :{:D :H G}
         :{:A :F H}
         {:A {:D {:F H G} E} B}
         C
       }`)
   let ShortContra = lc(`
           {
             :{:{:A B} C}
             :{:{:D E} B}
             :{:{:F G} E}
             :{:D :H G}
             :{:A :F H}
             C
           }`)

  test( 'We can Validate the Infamous Bug Proposition', () => {
    expect( lc(`{ :{ :W :V U V } :W :V U }`).Validate() ).to.be.ok()
  } )

  test( 'We can Validate Pierce\'s Law', () => {
    expect( lc(`{ :{ :{ :P Q } P } P }`).Validate() ).to.be.ok()
  } )

  test( 'We can Validate the short Contrapositive Proof', () => {
    expect( ShortContra.Validate() ).to.be.ok()
  } )

  test( 'We can Validate the Contrapositive Proof', () => {
    expect( Contrapositive.Validate() ).to.be.ok()
  } )

  // checking accessibility
  lctest( '{ :{ :A B } { A } B }', false )
  lctest( '{ :{ :A B } { :A } B }', false )
  lctest( '{ :{ :A B } :{ A } B }' )
  lctest( '{ :A { A } }' )
  lctest( '{ :{ A } { A } }' )
  lctest( '{ :{ { A } } A }')
  lctest( '{ :{ { A } } { A } }' )
  lctest( '{ :{ { A } } { { A } } }' )
  lctest( '{ { :{ A } } { { A } } }', false )

} )

suite( 'Validate large documents', () => {

  let Proofs = lc( Proofstr )
  let AllofLurch = lc( AllofLurchstr )
  let EvenMoreLurch = lc( EvenMoreLurchstr )

  test( 'We can Validate a few proofs', () => {
    expect( Proofs.Validate() ).to.be.ok()
  } )

  test( 'We can Validate All of Lurch and a few proofs', () => {
    expect( AllofLurch.Validate() ).to.be.ok()
  } )

  test( 'We can Validate Even More of Lurch and a few proofs', () => {
    expect( EvenMoreLurch.Validate() ).to.be.ok()
  } )

} )
