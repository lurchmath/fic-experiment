
// Tests conversion to cnf and SAT validation

// import expect.js
let expect = require( 'expect.js' )

// import all classes defined in this repo
const { OM, Structure, LC, Statement, Environment }
      = require( '../classes/all.js' )
const { AllofLurchstr } = require( './data/AllofLurch.js' )

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

suite( 'Validate conversion to cnf.', () => {
  cnftest('P',['P'])
  cnftest(':P',[':P'])
  cnftest('{ P }',['P'])
  cnftest('{ :P }')
  cnftest('{ P Q }',['P'],['Q'])
  cnftest('{ P Q }',['Q'],['P'])
  cnftest('{ :P Q }',[':P','Q'])
  cnftest('{ :P Q }',['Q',':P'])
  cnftest('{ :P :Q R }',[':P',':Q','R'])
  cnftest('{ :P :Q R }',[':P',':Q','R'],['R',':P',':Q',':Q'])
  cnftest('{ :P :Q R S }',[':P',':Q','R'],[':Q',':P','S'])
  cnftest('{ :P :Q R S }',[':P',':Q','R'],[':Q',':P','S'])
  cnftest('{ :{ :P Q } Q }',['P','Q'],[':Q','Q'])
} )

suite( 'Validate some short weird LCs.', () => {

  test( 'We can Validate the Infamous Bug Proposition', () => {
    expect( lc(`{ :{ :W :V U V } :W :V U }`).Validate() ).to.be.ok()
  } )
  test( 'We can Validate Pierce\'s Law', () => {
    expect( lc(`{ :{ :{ :P Q } P } P }`).Validate() ).to.be.ok()
  } )
  lctest( '{ :{ :A  B } { A } B }', false )
  lctest( '{ :{ :A  B } { :A } B }', false )
  lctest( '{ :{ :A  B } :{ A } B }' )
  lctest( '{ :A { A } }' )
  lctest( '{ :{ A } { A } }' )
  lctest( '{ :{ { A } } A }')
  lctest( '{ :{ { A } } { A } }' )
  lctest( '{ :{ { A } } { { A } } }' )
  lctest( '{ { :{ A } } { { A } } }', false )

} )

suite( 'Validate large documents', () => {

  let AllofLurch = lc( AllofLurchstr )

  test( 'We can Validate All of Lurch and a few proofs', () => {
    expect( AllofLurch.Validate() ).to.be.ok()
  } )

} )
