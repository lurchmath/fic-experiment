//
//  PropProofsTxt.js - stores a giant string that contains the formulas for Prop
//  logic and a few proofs.
//  We store it in a separate file since it's 300 lines long, and then just
//  import it as needed.

{
    // and+
    :[ :{ W V }
       and(W,V)
       and(V,W)
     ]

    // and-
    :[ :and(W,V)
        W
        V
     ]

    // or+
    :[ :W
       or(W,V)
       or(V,W)
     ]

    // or-
    :[ :or(W,V)
       :{ :W R }
       :{ :W R }
       R
     ]

    // ⇒+
    :[
       :{ :W V }
       ⇒(W,V)
     ]

    // ⇒-
    :[ :W
       :⇒(W,V)
       V
     ]

    // ⇔+
    :[
       :{ :W V }
       :{ :V W }
       ⇔(W,V)
     ]

    // ⇔-
    :[
       :⇔(W,V)
       { :V W }
       { :W V }
     ]

    // ¬+
    :[
       :{ :W →← }
       ¬(W)
     ]

    // ¬-
    :[
       :{ :¬(W) →← }
       W
     ]

    // →←+
    :[
       :W
       :¬(W)
       →←
     ]

    // And now we do a bunch of proofs, instantiating the above theorems as needed

        ////////////////////
        // INSTANTIATIONS //
        ////////////////////
        // or+
        :{ :¬(P)
           or(P,¬(P))
         }
        // or+
        :{ :P
           or(P,¬(P))
         }
        // or+
        :{ :P
           or(P,Q)
         }
        // or+
        :{ :Q
           or(P,Q)
         }
        // or+
        :{ :or(P,Q)
           or(or(P,Q),R)
         }
        // or+
        :{ :R
           or(or(P,Q),R)
         }
        // or+
        :{ :P
           or(P,and(¬(P),P))
         }
        // or+
        :{ :¬(P)
           or(¬(P),¬(Q))
         }
        // or+
        :{ :¬(Q)
           or(¬(P),¬(Q))
         }

        // or-
        :{ :or(Q,R)
           :{ :Q or(or(P,Q),R) }
           :{ :R or(or(P,Q),R) }
           or(or(P,Q),R)
         }
        // or-
        :{ :or(P,or(Q,R))
           :{ :P or(or(P,Q),R) }
           :{ :or(Q,R) or(or(P,Q),R) }
           or(or(P,Q),R)
         }
        // or-
        :{ :or(¬(P),¬(Q))
           :{ :¬(P) →← }
           :{ :¬(Q) →← }
           →←
         }

        // →←+
        :{ :or(P,¬(P))
           :¬(or(P,¬(P)))
           →←
         }
        // →←+
        :{ :¬(or(¬(P),¬(Q)))
           :or(¬(P),¬(Q))
           →←
         }
        // →←+
        :{ :¬(and(P,Q))
           :and(P,Q)
           →←
         }
        // →←+
        :{ :¬(P)
           :P
           →←
         }
        // →←+
        :{ :¬(Q)
           :Q
           →←
         }

        // not-
        :{
           :{ :¬(P) →← }
           P
         }
        // not-
        :{
           :{ :¬(Q) →← }
           Q
         }
        // not-
        :{
           :{ :¬(or(P,¬(P))) →← }
           or(P,¬(P))
         }
        // not-
        :{
           :{ :¬(or(¬(P),¬(Q))) →← }
           or(¬(P),¬(Q))
         }

        // not+
        :{
           :{ :and(P,Q) →← }
           ¬(and(P,Q))
         }

        // ⇒+
        :{
           :{ :→← P }
           ⇒(→←,P)
         }
        // ⇒+
        :{
           :{ :or(P,or(Q,R)) or(or(P,Q),R) }
           ⇒(or(P,or(Q,R)),or(or(P,Q),R))
          }
        // ⇒+
        :{
           :{ :P or(P,and(¬(P),P)) }
           ⇒(P,or(P,and(¬(P),P)))
         }
        // ⇒+
        :{
           :{ :or(P,and(¬(P),P)) P }
           ⇒(or(P,and(¬(P),P)),P)
         }
        // ⇒+
        :{
           :{ :P ⇔(P,or(P,and(¬(P),P))) }
           ⇒(P,⇔(P,or(P,and(¬(P),P))))
          }
        // ⇒+
        :{
           :{ :¬(and(P,Q)) or(¬(P),¬(Q)) }
           ⇒(¬(and(P,Q)),or(¬(P),¬(Q)))
          }
        // ⇒+
        :{
           :{ :or(¬(P),¬(Q)) ¬(and(P,Q)) }
           ⇒(or(¬(P),¬(Q)),¬(and(P,Q)))
          }

        // ⇔+
        :{
           :⇒(P,or(P,and(¬(P),P)))
           :⇒(or(P,and(¬(P),P)),P)
           ⇔(P,or(P,and(¬(P),P)))
         }
        // ⇔+
        :{
           :⇒(¬(and(P,Q)),or(¬(P),¬(Q)))
           :⇒(or(¬(P),¬(Q)),¬(and(P,Q)))
           ⇔(¬(and(P,Q)),or(¬(P),¬(Q)))
         }

        // and+
        :{ :P :Q
           and(P,Q)
         }
        // and+
        :{ :P :Q
           and(P,Q)
         }

        // and-
        :{ :and(P,Q)
           P Q
         }

       ////////////////////

    // Theorem 1 (excluded middle): P or not P
    // Proof:
      { :¬(or(P,¬(P)))
        { :¬(P)
        or(P,¬(P))   // by or+
        →←           // by →←+
        }
      P              // by not-
      or(P,¬(P))     // by or+
      →←             // by →←+
      }
    or(P,¬(P))       // by not-
    // ◼

    // Theorem (anything follows from →←): →←⇒P
    // Proof:
      { :→←
        { :¬(P)
        →←         // by copy
        }
        P          // by not-
      }
    ⇒(→←,P)        // by ⇒+
    // ◼

    // Theorem (associativity of 'or'):  P or (Q or R) ⇒ (P or Q) or R
    // Proof:
    { :or(P,or(Q,R))

      { :P
      or(P,Q)                  // by or+
      or(or(P,Q),R)            // by or+
      }

      { :or(Q,R)

        { :Q
        or(P,Q)                // by or+
        or(or(P,Q),R)          // by or+
        }

        { :R
        or(or(P,Q),R)          // by or+
        }

      or(or(P,Q),R)            // by or-
      }
    or(or(P,Q),R)              // by or-
    }

    ⇒(or(P,or(Q,R)),or(or(P,Q),R))  // by ⇒+
    // ◼

    // Theorem (The Most Beautiful Tautology): P ⇒ (P ⇔ P or (¬(P) and P))
    // Proof:
      { :P
        { :P
        or(P,and(¬(P),P))           // by or+
        }
      ⇒(P,or(P,and(¬(P),P)))        // by ⇒+
        { :or(P,and(¬(P),P))
        P                           // by copy
        }
      ⇒(or(P,and(¬(P),P)),P)        // by ⇒+
      ⇔(P,or(P,and(¬(P),P)))        // by ⇔+
      }
    ⇒(P,⇔(P,or(P,and(¬(P),P))))     // by ⇒+
    // ◼

    // Theorem (DeMorgan's Law): ¬(P and Q) ⇔ ¬(P) or ¬(Q)
    // Proof:
      { :¬(and(P,Q))
        { :¬(or(¬(P),¬(Q)))
          { :¬(P)
          or(¬(P),¬(Q))      // by or+
          →←                 // by →←+
          }
        P                    // by not-
          { :¬(Q)
          or(¬(P),¬(Q))      // by or+
          →←                 // by →←+
          }
        Q                    // by not-
        and(P,Q)             // by and+
        →←                   // by →←+
        }
      or(¬(P),¬(Q))                // by not-
      }
    ⇒(¬(and(P,Q)),or(¬(P),¬(Q)))   // by ⇒+
      { :or(¬(P),¬(Q))
        { :and(P,Q)
        P                    // by and-
        Q                    // by and-
          { :¬(P)
          →←                 // by →←+
          }
          { :¬(Q)
          →←                 // by →←+
          }
        →←                   // by or-
        }
      ¬(and(P,Q))            // by not+
      }
    ⇒(or(¬(P),¬(Q)),¬(and(P,Q)))    // by ⇒+
    ⇔(¬(and(P,Q)),or(¬(P),¬(Q)))    // by ⇔+
    // ◼
  }
