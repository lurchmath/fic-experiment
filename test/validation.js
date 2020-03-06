
// Tests validation of an LC from lc.js

// import expect.js
let expect = require( 'expect.js' )

// import relevant classes and the deduction routine
const { LC, Statement, Environment, existsDerivation } =
  require( '../classes/all.js' )

let lc = ( s ) => LC.fromString( s )

let validate = ( problem , opts ) => {
   // console.log('Checking: '+problem)
   let options = (!opts) ? {FIC: true , Scopes: true , Bound: true } : opts
   let L = LC.fromString(problem)
   // console.log(L)
   L.validate()
   // console.log('Validated to: ', L.toString(true))
   return L.toString( options )
}

suite( 'Validation', () => {

  test( 'Make sure that the LC meaning for Rule (S) works as expected.', () => {
     expect( lc('{ }').hasSameMeaningAs(lc('{ }'))).to.be(true)
     expect( lc(':{ }').hasSameMeaningAs(lc('{ }'))).to.be(false)
     expect( lc('x').hasSameMeaningAs(lc('x'))).to.be(true)
     expect( lc('P(x)').hasSameMeaningAs(lc('P(x)'))).to.be(true)
     expect( lc(':P(x)').hasSameMeaningAs(lc('P(x)'))).to.be(false)
     expect( lc('{ A B(x) }').hasSameMeaningAs(lc('{ A B(x) }'))).to.be(true)
     expect( lc('{ A :B(x) }').hasSameMeaningAs(lc('{ A B(x) }'))).to.be(false)
     expect( lc('{ A :B C }').hasSameMeaningAs(lc('{ A B C }'))).to.be(false)
     expect( lc('Declare{ c P(c) }').hasSameMeaningAs(
             lc('Declare{ c P(c) }'))).to.be(true)
     expect( lc('Declare{ c P(c) }').hasSameMeaningAs(
             lc('Let{ c P(c) }'))).to.be(false)
     expect( lc('Declare{ c P(c) }').hasSameMeaningAs(
             lc('Let{ c P(c) }'))).to.be(false)
     expect( lc('Declare{ c }').hasSameMeaningAs(
             lc('Declare{ x }'))).to.be(false)
     expect( lc('Let{ x }').hasSameMeaningAs(
             lc('Let{ x }'))).to.be(true)
     expect( lc('{ Let{ x } }').hasSameMeaningAs(
             lc('{ x }'))).to.be(false)
  } )

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

  test( 'And a few mimicking rules of inference for kicks.', function () {
    this.timeout( 0 ) // so mocha will let this test run as long as needed
    // (Note that you must use function above, not () =>, so "this" works.)
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
      expect(existsDerivation([D],D)).to.be(true)
      expect(existsDerivation([D,L],D)).to.be(true)
      expect(existsDerivation([D,L],L)).to.be(true)
      expect(existsDerivation([D],L)).to.be(false)
      expect(existsDerivation([L],D)).to.be(false)
      expect(existsDerivation([D],Pst)).to.be(true)
      expect(existsDerivation([Pst],D)).to.be(false)
      expect(existsDerivation([L],Pst)).to.be(true)
      expect(existsDerivation([Pst],L)).to.be(false)
      expect(existsDerivation([],Pst)).to.be(false)
      expect(existsDerivation([],L)).to.be(false)
      expect(existsDerivation([],X)).to.be(false)
      expect(existsDerivation([],DA)).to.be(true)
  } )

  test( 'Testing valdation involving declarations.', () => {
    expect(validate('{ Let{ x x } }')).to.be('{ Let{ x✓ x }✗ }')
    expect(validate('Declare{ s t P(s,t) }')).to.be('Declare{ s✓ t✓ P(s,t) }')
    expect(validate('{ Declare{ s t P(s,t) } }'))
              .to.be('{ Declare{ s✓ t✓ P(s,t) }✗ }')
    expect(validate('{ :Declare{ s t P(s,t) } P(s,t) }'))
             .to.be('{ :Declare{ s✓ t✓ P(s,t) } P(s,t)✓ }')
    expect(validate('{ Declare{ s t P(s,t) } P(s,t) }'))
             .to.be('{ Declare{ s✓ t✓ P(s,t) }✗ P(s,t)✓ }')
    expect(validate('{ Let{ s P } Let{ t Q } Let{ s Q } }'))
             .to.be('{ Let{ s✓ P }✗ Let{ t✓ Q }✗ Let{ s✗ Q }✗ }')
    expect(validate('{ Let{ s P } Let{ t Q } Let{ s P } Declare{ t Q } }'))
             .to.be('{ Let{ s✓ P }✗ Let{ t✓ Q }✗ Let{ s✗ P }✓ Declare{ t✗ Q }✗ }')
    expect(validate('{ :Let{ s P } :Let{ t Q } Let{ t Q } Let{ s P } }'))
             .to.be('{ :Let{ s✓ P } :Let{ t✓ Q } Let{ t✗ Q }✓ Let{ s✗ P }✓ }')
    expect(validate('{ P Declare{ s { :P Q(s) } } Q(s) }'))
             .to.be('{ P✗ Declare{ s✓ { :P Q(s) } }✗ Q(s)✓ }')
    expect(validate('{ :Let{ x y { :P W(y) Q(x,y) Z(x) } } :P Q(x,y) }'))
            .to.be('{ :Let{ x✓ y✓ { :P W(y) Q(x,y) Z(x) } } :P Q(x,y)✓ }')
    expect(validate('{ :Declare{ x { :P W(x) Z(x) } } :P Declare{ x W(x) } }'))
            .to.be('{ :Declare{ x✓ { :P W(x) Z(x) } } :P Declare{ x✗ W(x) }✗ }')
    expect(validate('{ :Declare{ x { :P W(x) Z(x) } } :P Declare{ x { :P W(x) } } W(x) }'))
            .to.be('{ :Declare{ x✓ { :P W(x) Z(x) } } :P Declare{ x✗ { :P W(x) } }✓ W(x)✓ }')
    expect(validate('{ :{ :P W(x) Z(x) } :P Declare{ x W(x) } }'))
            .to.be('{ :{ :P W(x) Z(x) } :P Declare{ x✓ W(x) }✗ }')
    expect(validate('{ :P W(x) Z(x) Declare{ x W(x) } }'))
            .to.be('{ :P W(x)✗ Z(x)✗ Declare{ x✗ W(x) }✗ }')
    expect(validate('{ { W(x) Z(x) } Declare{ y W(x) } }'))
            .to.be('{ { W(x)✗ Z(x)✗ } Declare{ y✓ W(x) }✗ }')
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
                + '     Declare{ q✓ r✓       '
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
                + '  Declare{ q✓ r✓          '
                + '    { :h(a,b,c,d)       '
                + '      eq(d,r)           '
                + '    }                   '
                + '  }✓                    '
                + '}                       '
      ans = ans.replace(/\s{2,}/g, ' ')
      ans = ans.trim()
      expect(validate(divalg)).to.be(ans)
      expect(validate('{ :{ :{ :Let{ x W(x) } Z(x) } ~All(x,implies(W(x),Z(x))) } { :Let{ x W(x) } Z(x) } ~All(x,implies(W(x),Z(x))) }'))
              .to.be('{ :{ :{ :Let{ x✓ W(x) } Z(x) } ~All(x✓,implies(W(x),Z(x))) } { :Let{ x✓ W(x) } Z(x)✗ } ~All(x✓,implies(W(x),Z(x)))✓ }')
  } )

  test( 'Testing valdation involving quantifiers.', () => {
    expect(validate('{ :~All(x,x) }')).to.be('{ :~All(x✓,x) }')
    expect(validate('{ ~Some(x,~All(x,x)) }')).to.be('{ ~Some(x✓,~All(x✓,x))✗ }')
    expect(validate('{ :~Some(x,~All(y,x)) }')).to.be('{ :~Some(x✓,~All(y✓,x)) }')
    expect(validate('{ :Let{ x { } } :~All(x,x) }')).to.be('{ :Let{ x✓ {  } } :~All(x✓,x) }')
    expect(validate('{ :Declare{ x { } } :~All(x,x) }')).to.be('{ :Declare{ x✓ {  } } :~All(x✗,x) }')

  } )

} )
