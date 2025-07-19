import {Webhook} from 'svix'
import userModel from '../models/userModel.js'
// API Controller function to manage CLeark User With database
// http://localhost:4000

import razorpay from 'razorpay'
import transcationModel from '../models/transactionModel.js'


const clerkWebhooks = async (req,res)=>{
    try {
        // Create a Svix instance with clerk webhook secret.
        const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET)

        await whook.verify(JSON.stringify(req.body),{
            "svix-id":req.headers["svix-id"],
            "svix-timestamp":req.headers["svix-timestamp"],
            "svix-signature":req.headers["svix-signature"]
        })

        const {data,type} =req.body

        switch (type) {
            case "user.created":{

                const userData = {
                    clerkId:data.id,
                    email:data.email_addresses[0].email_address,
                    firstName: data.first_name,
                    lastName:data.last_name,
                    photo: data.image_url
                }


                await userModel.create(userData)
                res.json({})
            
                 break;
            }

            case "user.updated":{

                const userData = {

                    email:data.email_addresses[0].email_address,
                    firstName: data.first_name,
                    lastName:data.last_name,
                    photo: data.image_url
                }

                await userModel.findOneAndUpdate({clerkId:data.id},userData)
                res.json({})
            
                 break;
            }

            case "user.deleted":{

                await userModel.findOneAndDelete({clerkId:data.id})
                res.json({})
            
                 break;
            }
                
               
        
            default:
                break;
        }


        
    } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message})
        
    }
}




// API controller function to get user available credits data


const userCredits = async (req, res) => {
  try {
    const { clerkId } = req.body;

    if (!clerkId) {
      return res.status(400).json({ success: false, message: "clerkId is required" });
    }

    const userData = await userModel.findOne({ clerkId });

    if (!userData) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, credits: userData.creditBalance });
  } catch (error) {
    console.error("Error fetching user credits:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


// gateway initalise

const razorpayInstance = new razorpay({
  key_id:process.env.RAZORPAY_KEY_ID,
  key_secret:process.env.RAZORPAY_KEY_SECRET,
})


// API to make payment for credits

  const paymentRazorpay = async (req,res) =>{
       try {

        const {clerkId , planId} = req.body


        const userData = await userModel.findOne({ clerkId})


        if (!userData || !planId) {
          return res.json ({success:false , message :'Invalid Credentials'})
        }

        let credits , plan , amount ,date


        switch (planId) {
          case 'Basic':
            plan = 'Basic'
            credits = 100
            amount=10

            break;

            case 'Advanced':
            plan = 'Advanced'
            credits = 500
            amount=50

            break;

            case 'Business':
            plan = 'Business'
            credits = 5000
            amount= 250

            break;
        
          default:
            break;
        }

        date = Date.now()

        // Creating transction

        const transactionData = {
          clerkId,plan,amount,credits,date
        }

        const newTransaction = await transactionModel.create(transactionData)


        const options ={
          amount:amount *100,
          currency :process.env.CURRENCY,
          receipt:newTransaction._id
        }

        await razorpayInstance.orders.create(options,(error,order)=>{
             if (error) {
              return res.json({success:false,message:error})
              
             }
             res.json({success:true,order})
        })



        
       } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message})
        
       }
  }

  // API Controller function to verify razorpay payment


  const verifyRazorPay = async (req,res) => {
     try {

      const {razorpay_order_id} = req.body


      const  orderinfo = await razorpayInstance.orders.fetch(razorpay_order_id)

      if (orderinfo.status === 'paid' ) {
         

        const transactionData = await transcationModel.findById(orderinfo.receipt)
        if (transactionData.payment) {
          return res.json({success:false,message:'Payment Faild'})
        }

        // Andding Credits in user data

        const userData = await userModel.findOne({clerkId:transactionData.clerkId})
        const creditBalance = userData.creditBalance + transactionData.credits
        await userModel.findByIdAndUpdate(userData._id,{creditBalance})


        // amking the payment true
        await transcationModel.findByIdAndUpdate(transactionData._id,{payment:true})
       


        res.json({success:true , message: "Credits Added"});

      }
      
     } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message})
     }
  }


export {clerkWebhooks ,userCredits ,paymentRazorpay , verifyRazorPay}