const prisma = require("../../../utils/prisma");




  const role=async(req,res)=>{
    let rollId=Number(req.params.id);
    let singleRole;
    let reqq=null;
    if(rollId==3){
        singleRole= null;
    }
    else if(rollId==4){
        reqq =3;
    }
    else if(rollId==5){
        reqq=6;
    }
    else if(rollId==6){
        reqq=3;
    }
    else if(rollId==1){
        reqq=3;
    }

    else if(rollId==7){
        reqq=3;
    }
    else if(rollId==8){
        reqq=7;
    }
    else if(rollId==2){
        reqq=5;
    }


    if(reqq!=null){
        singleRole = await prisma.user.findMany({
            where: {
              roleId: reqq,
            }
            
          });
    }
    // const roleId = singleRole.reference_id; // Assuming reference_id is the field where the roll id is saved
    // const superviser = await prisma.role.findMany({
    //   where: {
    //     id: roleId,
    //   },
    // });

    // // Add the roleType to the user data
    // singleRole.superviser = superviser;
     res.status(200).json({
      singleRole
     })
  }


  const rolenew=async(req,res)=>{
    let rollId=Number(req.params.id);
    let singleRole;
    let reqq=null;
    if(rollId==3){
        singleRole= null;
    }
    else if(rollId==4){
        reqq =4;
    }
    else if(rollId==5){
        reqq=5;
    }
    else if(rollId==6){
        reqq=6;
    }
    else if(rollId==1){
        reqq=1;
    }

    else if(rollId==7){
        reqq=7;
    }
    else if(rollId==8){
        reqq=8;
    }
    else if(rollId==2){
        reqq=2;
    }


    if(reqq!=null){
        singleRole = await prisma.user.findMany({
            where: {
              roleId: reqq,
            }
            
          });
    }
    // const roleId = singleRole.reference_id; // Assuming reference_id is the field where the roll id is saved
    // const superviser = await prisma.role.findMany({
    //   where: {
    //     id: roleId,
    //   },
    // });

    // // Add the roleType to the user data
    // singleRole.superviser = superviser;
     res.status(200).json({
      singleRole
     })
  }











module.exports = {
    role,
    rolenew
  };