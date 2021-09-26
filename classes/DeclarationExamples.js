// Examples and Counterexamples for testing Declaration designs for LCs

// Current proposal for design:
//
// 1. Number constant declarations  (Declare{}s, not Let{}s).
//
// 2. Skolemize only the constants which are in the scope of a declaration
//    by subscripting them with the number of the constant declaration that
//    it is declared by (called it's .scope() in fic-experiments) and appending
//    (x1,...,xn) where x1,...,xn are the free variables declared at that same
//    point in the document.
//
// Note: everything thing here is just for propositional LCs+Declarations.
//       No formulas or metavariables yet. Manual instantiation only.
//
// Also note: these are not any sort of coherent collection in any sensible order
// unlike they would be if I was at the point where I was making a Mocha test
// suite.  These are the examples I was using to debug and test the 10000
// attempted implementations of declarations.

// NAME: fauxBadDec
// VALID: true
//
// Using faux-declarations shows that this validates just as propositions
{ :{ Dec(c,<(0,c)) }
  :{ :Dec(c,<(0,c)) <(0,c) }
   { :Let(c)
     <(0,c)
   }
}

// NAME: badDec
// VALID: false
//
// Using actual declarations in the same thing should not validate
{ :{ Declare{ c <(0,c) } }
  :{ :Declare{ c <(0,c) } <(0,c) }
   { :Let{ c {} }
     <(0,c)
   }
}

// NAME: fauxBadDec2
// VALID: true
//
// Using faux-declarations shows that this validates just as propositions
{ :{ Dec(c,<(0,c)) }
  :{ Dec(c,<(c,0)) }
  :{ :Dec(c,<(0,c)) <(0,c) }
  :{ :Dec(c,<(c,0)) <(c,0) }
   { <(c,0) <(0,c) }
}

// NAME: badDec2
// VALID: false
//
// Using actual declarations in the same thing should not validate
{ :{ Declare{ c  <(0,c) } }
  :{ Declare{ c  <(c,0) } }
  :{ :Declare{ c  <(0,c) } <(0,c) }
  :{ :Declare{ c  <(c,0) } <(c<0) }
   { <(c,0) <(0,c) }
}

// NAME: fauxNestedDec
// VALID: true
//
// Using faux-declarations shows that this validates just as propositions
{ :A
  :{ :A Dec(c) isInt(c) }
  :{ :{ Dec(c) isInt(c) } Dec(c) <(c,0) }
  :{ :{ Dec(c) isInt(c) } Dec(c) <(0,c) }
  { Dec(c) <(c,0) <(0,c) }
}

// NAME: nestedDec
// VALID: false
//
// Using actual declarations in the same thing should not validate
{ :A
  :{ :A Declare{ c {} } isInt(c) }
  :{ :{ Declare{ c {} } isInt(c) } Declare{ c {} } <(c,0) }
  :{ :{ Declare{ c {} } isInt(c) } Declare{ c {} } <(0,c) }
  { Declare{ c {} } <(c,0) <(0,c) }
}

// NAME: existsminus
// VALID: true
//
// INST means "INSTANTIATION"
{ :{ :∃(x,P(x))  Declare{ c  P(c) } }  // INST of ∃-
  :∃(x,P(x))
  Declare{ c  P(c) }
}

// NAME: DivAlg
// VALID: true
//
// OK, this is a beast.  Note that this is not the prefered way to encode this
// but we have our hands tied because we can't currently have a declaration inside
// the body of another declaration.  What I would prefer to do is have the
// declaration of s,t at location ** in the proof
    { :Declare{ Posint = ⋅ + ≤ < 0 five nada }
      // we declare these here to get this to validate, but it's not M^2 where
      // we would put them
      :Let{ s t nada }
      :Posint(a) :Posint(five)
      :{ :Posint(a) :Posint(five)
         Declare{ q r
           { =(a,+(⋅(five,q),r))
             ≤(0,r)
             <(r,five)
             {
               { // ** this is where the declaration of s,t should go if we could
                 :=(a,+(⋅(five,s),t))
                 :≤(0,t)
                 :<(t,five)
                 =(s,q)
                 =(t,r)
               }
             }
           }
         }
       } // INST of Div Alg Thm
       Declare{ q r
         { =(a,+(⋅(five,q),r))
           ≤(0,r)
           <(r,five)
           {
             {
               :=(a,+(⋅(five,s),t))
               :≤(0,t)
               :<(t,five)
               =(s,q)
               =(t,r)
             }
           }
         }
       }
       =(a,+(⋅(five,q),r))
    }

// NAME: dec2
// VALID: true
//
// Just making sure the B can escape the declaration in this simple example.
{ :Let{ x { :A B } }
  :A
  B
}

// NAME: dec3
// VALID: true
//
// Again, just making sure the B(c) can escape in this simple example, but in
// this case it depends on c.
    { :{ :A Declare{ c B(c) } }
      :A
      Declare{ c B(c) }
      B(c)
    }

// NAME: dec4
// VALID: false
//
// Here we are checking that the B(c) cannot escape without the declaration.
{ :{ :A Declare{ c B(c) } W }
  :A
  B(c)
}

// NAME: Constant quantifiers
// VALID: false, but that's not the purpose
//
// Just checking that we can declare a quantifier to be a constant without
// any issues, e.g. if we had Declare{ ∀ {} } at the top of a document (which I
// do).
{ Declare{ c P(c) } ~c(x,Q(x)) }

// NAME: imp
// VALID: true
//
// Similar to dec3 above.  Sometimes I made simpler examples to isolate a bug.
{ :{ Declare{ c x(c) } } Declare{ c x(c) } x(c) }

// NAME: implicitbug
// VALID: true
//
// Similar to dec3 and imp above.
// Sometimes I made simpler examples to isolate a particular bug.
{ :{ Declare{ c x } } Declare{ c x } }
// We might compare this to
{ :Declare{ c x } Declare{ c x } }
// which could/should? fail the scoping on the second c (unless we allow that
// and there's actually a reason why we might want to but I won't go into it
// here).

// NAME: scopecheck
// VALID: false
//
// Here the constant declaration of x is in the scope of the Let declaration of x.
// Note that we are still defining the definition of Let and Declare, so I don't
// yet take off the table the option that we might allow things like this in
// case it's useful to solve some problem.
{ Let{ x nada } Declare{ x nada } x }

// NAME: ∀+ example
// VALID: true
//
// A simple example of ∀+ rule that should work.
{
  :{ :{ :Let{x {} } P(x) } ~all(x,P(x)) }
  :{ :Let{ x {} }
      P(x)
  }
  ~all(x,P(x))
}


// NAME: ∃- example
// VALID: true
//
// A simple example of ∃- rule that should work.
{ :{ :~exists(x,P(x)) Declare{ c P(c) } }
  :~exists(x,P(x))
  Declare{ c P(c) }
}

// NAME: Swapping Quantifiers
// VALID: false
//
// A basic proof in FOL.  This should not validate obviously and is missing
// all of the instantiated rules for ∀+ ∀- ∃+ ∃-.
// Thus, this example is incomplete in its current form.
// If you expand it and work it out, this example shows why we need to replace
// c with a Skolem (constant) function and not just a constant, because the only//// thing that prevents it from working is the 'free to replace' constraint on
// instantiating formulas.
{
  :∀x,∃y,x<y
  { :Let(z)
    ∃y,z<y
    Declare(c,z<c)
    z<c
  }
  ∀x,x<c
  ∃y,∀x,x<y
}
