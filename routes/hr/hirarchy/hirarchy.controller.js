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
        reqq=4;
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
        singleRole = await prisma.role.findUnique({
            where: {
              id: Number(reqq),
            },
            include: {
              rolePermission: {
                include: {
                  permission: true,
                },
              },
            },
          });
    }


     res.status(200).json({
      singleRole
     })
  }











module.exports = {
    role,
  };