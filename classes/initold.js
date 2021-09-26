const { Structure } = require( '../dependencies/structure.js' )
const { OM } = require( '../dependencies/openmath.js' )
const { LC, lc } = require( './lc.js' )
const { isMetavariable, setMetavariable, clearMetavariable } =
  require( '../dependencies/matching.js' )
const { Step } = require( './step.js' )

// convenience utilities
let print = console.log
let FIC = { FIC: true }
let Scopes = { Scopes: true }
let Bound = { Bound: true }
let IDs = { ID: true }
let All = { FIC: true , Scopes: true , Bound: true , ID: true }
let Indent = { Indent: true }
let IndentAll = { FIC: true , Scopes: true , Bound: true ,
                  Indent: true , ID: true }

const { Proofstr } = require( '../test/data/PropProofs.js' )
const { AllofLurchstr } = require( '../test/data/AllofLurch.js' )
const { EvenMoreLurchstr } = require( '../test/data/EvenMoreLurch.js' )
let L = lc(':{ :{ :P Q } Q }')
let Proofs = lc(Proofstr)
let AllofLurch = lc(AllofLurchstr)
let EvenMoreLurch = lc(EvenMoreLurchstr)
let Pierce = lc(`{ :{ :{ :P Q } P } P }`)
let BadLC = lc(`:{ :{ :W :V U V } :W :V U }`)
let SimpleSwitch = lc('{:{:{:A B} {:A C}} {:{:B C} C}}')
let Shunting = lc('{ :{ :G { :A B } } { :G :A B } }')
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
let commAnd = lc(`
  { :{ :{ :and(A,B) and(B,A) } ⇒(and(A,B),and(B,A)) }
    :{ :A :B and(A,B) and(B,A) }
    :{ :and(A,B) A B }
       { :and(A,B)
         A
         B
         and(B,A)
       }
    ⇒(and(A,B),and(B,A))
  }`)
let shortCommAnd = lc(`
    { :{ :{ :and(A,B) and(B,A) } ⇒(and(A,B),and(B,A)) }
      :{ :A :B and(A,B) and(B,A) }
      :{ :and(A,B) A B }
         { :and(A,B)
           and(B,A)
         }
      ⇒(and(A,B),and(B,A))
    }`)
let badDec = lc(`
    { :{ Dec(c,0<c) }
      :{ :Dec(c,0<c) 0<c }
       { :Let(c)
         0<c
       }
    }`)
let badDec2 = lc(`
    { :{ Dec(c,0<c) }
      :{ Dec(c,c<0) }
      :{ :Dec(c,0<c) 0<c }
      :{ :Dec(c,c<0) c<0 }
       { c<0 0<c }
    }`)
let goodDec2 = lc(`
    { :{ Declare{ c lt(zero,c) } }
      :{ Declare{ c lt(c,zero) }  }
      :{ :Declare{ c lt(zero,c) } lt(zero,c) }
      :{ :Declare{ c lt(c,zero) } lt(c,zero) }
       { lt(zero,c) lt(c,zero) }
    }`)

let notbadDec = lc(`
    { :{ Dec(c,0<c) }
      :{ Dec(d,d<0) }
      :{ :Dec(e,0<e) 0<e }
      :{ :Dec(f,f<0) f<0 }
       { g<0 }
    }`)
let nestedDec = lc(`
    { :A
      :{ :A Dec(c) isInt(c) }
      :{ :{ Dec(c) isInt(c) } Dec(c) c<0 }
      :{ :{ Dec(c) isInt(c) } Dec(c) 0<c }
      { Dec(c) c<0 0<c }
    }`)

let disbadDec = lc(`
    { :{ Dec(c,0<c) }
      :{ :Dec(c,0<c) :Dec(d,0<d) 0<d }
       { :Let(c) :Let(e)
         0<e
       }
    }`)
let disbadDec2 = lc(`
    { :{ Dec(c,0<c) }
      :{ Dec(c,c<0) Dec(d,d<0) }
      :{ :Dec(c,0<c) :Dec(e,0<e) 0<e }
      :{ :Dec(c,c<0) :Dec(f,f<0) f<0 }
       { c<0 0<c }
    }`)
let disnestedDec = lc(`
    { :A
      :{ :A Dec(c) isInt(c) }
      :{ :{ Dec(c) Dec(d) isInt(d) } Dec(c) Dec(e) e<0 }
      :{ :{ Dec(c) Dec(f) isInt(f) } Dec(c) Dec(g) 0<g }
      { Dec(c) Dec(h) h<0 0<h }
    }`)

let existsminus = lc(`
    { :{ :∃(x,P(x))  Dec(c,P(c)) }
      :∃(x,P(x))
      Dec(c,P(c))
    }`)

let DivAlgGood = lc(`
    { :Let{ s t t }
      :Posint(a) :Posint(five)
      :{ :Posint(a) :Posint(five)
         Declare{ q r
           { =(a,+(⋅(five,q),r))
             ≤(0,r)
             <(r,five)
             { :=(a,+(⋅(five,s),t))
               :≤(0,t)
               :<(t,five)
               =(s,q)
               =(t,r)
             }
           }
         }
       }
       Declare{ q r
         { =(a,+(⋅(five,q),r))
           ≤(0,r)
           <(r,five)
           { :=(a,+(⋅(five,s),t))
             :≤(0,t)
             :<(t,five)
             =(s,q)
             =(t,r)
           }
         }
       }
       =(a,+(⋅(five,q),r))
    }`)

let disDivAlgGood = lc(`
    { :Posint(a) :Posint(5)
      :{ :Posint(a) :Posint(5)
         Dec(q,r)
         { =(a,+(⋅(5,q),r))
           ≤(0,r)
           <(r,5)
           { :=(a,+(⋅(5,s),t))
             :≤(0,t)
             :<(t,5)
             =(s,q)
             =(t,r)
           }
         }
       }
       Dec(q,r)
       { =(a,+(⋅(5,q),r))
         ≤(0,r)
         <(r,5)
         { :=(a,+(⋅(5,s),t))
           :≤(0,t)
           :<(t,5)
           =(s,q)
           =(t,r)
         }
       }
       Dec(Q,R)
       { =(a,+(⋅(5,Q),R))
         ≤(0,R)
         <(R,5)
         { :=(a,+(⋅(5,s),t))
           :≤(0,t)
           :<(t,5)
           =(s,Q)
           =(t,R)
         }
       }
       =(a,+(⋅(5,Q),R))
    }`)

let dec1 = lc(`
    {
     :{
       :{ :Let{ x nada }
           P(x)
        }
        Y
        W
      }
      :{ :Let{ x nada }
         P(x)
      }
      W
    }`)
    // dec1.markDeclarations()
    // dec1.markScopes()
let dec2 = lc(`
    { :Let{ x { :A B } }
      :A
      B
    }`)
    // dec2.markDeclarations()
    // dec2.markScopes()
let dec3 = lc(`
    { :{ :A Declare{ c B(c) } }
      :A
      Declare{ c B(c) }
      B(c)
    }`)
    // dec3.markDeclarations()
    // dec3.markScopes()
let dec4 = lc(`
    { :{ :A Declare{ c B(c) } W }
      :A
      B(c)
    }`)
    // dec4.markDeclarations()
    // dec4.markScopes()

let s = lc(`{ f(x,g(y)) }`)
let gs = lc(`:{ f(x,g(y)) }`)
let t = lc(`{ Let{ x y } f(x) }`)
let gt = lc(`:{ Let{ x y } f(x) }`)
let q = lc(`{ Declare{ c P(c) } ~c(x,Q(x)) }`)
let tree = lc(`{ { { b c } a } { d { e f g }} }`)
// tree.markAll()

let nate = lc(`
  { Let{ x null }
    f(x)
    { Let{ y null }
      f(y)
      Let{ z null }
      z(x,y)
    }
    Let{ y null }
    eq(plus(x,y),t)
    { Let{ s null }
      { Let{ z }
        { eq(neg(z,q),times(x,plus(s,t))) }
      }
      eq(s,y)
    }
  }`)
let r=lc(`{ Declare{ f null } ~f(x,y(x)) }`)
// r.markAll()

let step1 = new Step(dec1,dec1.child(0).child(2))
let step2 = new Step(dec1,dec1.child(2))

let implicitbug = lc(`{ :{ Declare{ c x } } Declare{ c x } }`)
// implicitbug.markAll()
// implicitbug.show()

let simple = lc(`{ :A B }`)
t.markAll()
t.show()
