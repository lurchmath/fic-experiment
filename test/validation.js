
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

  test( 'Testing derivation involving declarations.', () => {
    let D = LC.fromString('Declare{ s t P(s,t) }')
    let Pst = LC.fromString('P(s,t)')
    let L = LC.fromString('Let{ s t { W P(s,t) H } }')
    let X = LC.fromString('Let{ x x }')
    let divalg= '{                       '
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
      let DA = LC.fromString(divalg)
      expect(derives(D,D)).to.be(true)
      expect(derives(D,L,D)).to.be(true)
      expect(derives(D,L,L)).to.be(true)
      expect(derives(D,L)).to.be(false)
      expect(derives(L,D)).to.be(false)
      expect(derives(D,Pst)).to.be(true)
      expect(derives(Pst,D)).to.be(false)
      expect(derives(L,Pst)).to.be(true)
      expect(derives(Pst,L)).to.be(false)
      expect(derives(Pst)).to.be(false)
      expect(derives(L)).to.be(false)
      expect(derives(X)).to.be(false)
      expect(derives(DA)).to.be(true)
  } )

  test( 'Testing valdation involving declarations.', () => {
    expect(validate('{ Let{ x x } }')).to.be('{ Let{ x x }✗ }')
    expect(validate('Declare{ s t P(s,t) }')).to.be('Declare{ s t P(s,t) }')
    expect(validate('{ Declare{ s t P(s,t) } }'))
              .to.be('{ Declare{ s t P(s,t) }✗ }')
    expect(validate('{ :Declare{ s t P(s,t) } P(s,t) }'))
             .to.be('{ :Declare{ s t P(s,t) } P(s,t)✓ }')
    expect(validate('{ Declare{ s t P(s,t) } P(s,t) }'))
             .to.be('{ Declare{ s t P(s,t) }✗ P(s,t)✓ }')
    expect(validate('{ P Declare{ s { :P Q(s) } } Q(s) }'))
             .to.be('{ P✗ Declare{ s { :P Q(s) } }✗ Q(s)✓ }')
    expect(validate('{ :Let{ x y { :P W(y) Q(x,y) Z(x) } } :P Q(x,y) }'))
            .to.be('{ :Let{ x y { :P W(y) Q(x,y) Z(x) } } :P Q(x,y)✓ }')
    expect(validate('{ :Declare{ x { :P W(x) Z(x) } } :P Declare{ x W(x) } }'))
            .to.be('{ :Declare{ x { :P W(x) Z(x) } } :P Declare{ x W(x) }✗ }')
    expect(validate('{ :Declare{ x { :P W(x) Z(x) } } :P Declare{ x { :P W(x) } } W(x) }'))
            .to.be('{ :Declare{ x { :P W(x) Z(x) } } :P Declare{ x { :P W(x) } }✓ W(x)✓ }')
    expect(validate('{ :{ :P W(x) Z(x) } :P Declare{ x W(x) } }'))
            .to.be('{ :{ :P W(x) Z(x) } :P Declare{ x W(x) }✗ }')
    let divalg= '{                       '
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
      let ans =   '{                       '
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
                + '  }✓                    '
                + '}                       '
      ans = ans.replace(/\s{2,}/g, ' ')
      ans = ans.trim()
      expect(validate(divalg)).to.be(ans)
  } )

} )
