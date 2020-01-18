
// Tests validation of an LC from lc.js

// import expect.js
let expect = require( 'expect.js' )

// import relevant classes and the deduction routine
const { LC, Statement, Environment, derives } = require( '../classes/all.js' )

let validate = ( problem ) => {
   // console.log('Checking: '+problem)
   let L = LC.fromString(problem)
   // console.log(L)
   L.validate()
   // console.log('Validated to: ', L.toString(true))
   return L.toString(true)
}

suite( 'Validation', () => {

  test( 'Things that don\'t need validation don\'t get it.', () => {
     expect(validate('{ }')).to.be('{  }')
     expect(validate('{ :A }')).to.be('{ :A }')
     expect(validate('{ { :A :B } :{ C D } }')).to.be('{ { :A :B } :{ C D } }')
  } )

  test( 'Simple correct things validate correctly.', () => {
     expect(validate('{ :A A }')).to.be('{ :A A✓ }')
     expect(validate('{ :{ :A B } :A B }')).to.be('{ :{ :A B } :A B✓ }')
     expect(validate('{ :{ :A B } :{ :B C } { :A C } }')).to.be('{ :{ :A B } :{ :B C } { :A C✓ } }')
     expect(validate('{ :{ :A B } { :{ :B C } :A C } }')).to.be('{ :{ :A B } { :{ :B C } :A C✓ } }')
  } )

  test( 'Simple incorrect or mixed things validate correctly.', () => {
     expect(validate('{ A B }')).to.be('{ A✗ B✗ }')
     expect(validate('{ A A }')).to.be('{ A✗ A✓ }')
     expect(validate('{ A { :B A } }')).to.be('{ A✗ { :B A✓ } }')
     expect(validate('{ A { A B } B }')).to.be('{ A✗ { A✓ B✗ } B✓ }')
     expect(validate('{ A { :A B } B }')).to.be('{ A✗ { :A B✗ } B✓ }')
     expect(validate('{ :C { :A B } B }')).to.be('{ :C { :A B✗ } B✗ }')
  } )

  test( 'And a few mimicking rules of inference for kicks.', () => {
    let proof = '{ :{ :{ A B } and(A,B) }'
              + '   :{ :and(A,B) A B }   '
              + '   :B                   '
              + '   :C                   '
              + '   :A                   '
              + '   B                    '
              + '   and(A,B)             '
              + '   A                    '
              + '}'
    let validproof = '{ :{ :{ A B } and(A,B) } :{ :and(A,B) A B } :B :C :A B✓ and(A,B)✓ A✓ }'
    expect(validate(proof)).to.be(validproof)
    proof = '{               '
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
          + '}               '
    validproof = '{ :{ :or(P,Q) :{ :P R } :{ :Q R } R } :{ :Q W R } :{ :P S R U } :or(W,U) :or(P,Q) R✓ }'
    expect(validate(proof)).to.be(validproof)
    proof = '{               '
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
          + '}               '
    validproof = '{ :{ :or(P,Q) :{ :P R } :{ :Q R } R } { :Q W✗ R✗ } :{ :P S R U } or(W,U)✗ :or(P,Q) R✓ }'
    expect(validate(proof)).to.be(validproof)
  } )

} )
