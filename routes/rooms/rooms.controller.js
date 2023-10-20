const { getPagination } = require("../../utils/query");
const prisma = require("../../utils/prisma");


const createrooms = async (req, res) => {
    try {
      const {locationId, roomName, } = req.body;

      const newroom = await prisma.room.create({
        data: {
            locationId,
            userId: req.auth.sub,
            roomName,
        },
      });
  
      return res.status(200).json({
        newroom,
        message: 'Room created successfully',
      });
    } catch (error) {
      console.error('Error creating room:', error);
      return res.status(400).json({ message: 'Failed to create room'});
    }
  };

  const getAllrooms = async (req, res) => {
    if (req.query.query === "all") {
      const allRooms = await prisma.room.findMany({
        orderBy: [{ id: 'desc' }],
        select: {
          id: true,
          roomName: true,
          status:true,
          location: {
            select: {
              id: true,
              locationName: true,
            },
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      });
      return res.status(200).json(allRooms);
    } else if (req.query.status === "true") {
      try {
        const { skip, limit } = getPagination(req.query);
        const allRooms = await prisma.room.findMany({
          where: {
            status: true,
          },
          orderBy: [{ id: 'desc' }],
        select: {
          id: true,
          roomName: true,
          status:true,
          location: {
            select: {
              id: true,
              locationName: true,
            },
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      });
        return res.status(200).json(allRooms);
      } catch (error) {
        return res.status(400).json({ message: "Failed to get unavailable room" });
      }
    } else {
      const { skip, limit } = getPagination(req.query);
      try {
        const allRooms = await prisma.room.findMany({
        orderBy: [{ id: 'desc' }],
        select: {
          id: true,
          roomName: true,
          status:true,
          location: {
            select: {
              id: true,
              locationName: true,
            },
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      });
        return res.status(200).json(allRooms);
      } catch (error) {
        return res.status(400).json({ message: "Failed to get all room" });
      }
    }
  };


  
  const updaterooms = async (req, res) => {
    try {
        const {locationId, roomName,status } = req.body;
      const updatedroom = await prisma.room.update({
        where: {
          id: Number(req.params.id),
        },
        data: {
            locationId,
            userId: req.auth.sub,
            roomName,
            status
        },
      });
  
      return res.status(200).json({
        updatedroom,
        message: "Rooms updated successfully",
      });
    } catch (error) {
      return res.status(400).json({ message: "Failed to update room"});
    }
  };
  const getroomById = async (req, res) => {
    try {
      const singroom = await prisma.room.findUnique({
        where: {
          id: Number(req.params.id),
        },
        select: {
          id: true,
          roomName: true,
          status:true,
          location: {
            select: {
              id: true,
              locationName: true,
            },
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      });
  
  
      return res.status(200).json(singroom);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  };
  
  const deleteroom = async (req, res) => {
    try {
      const deletedMeeting = await prisma.room.delete({
        where: {
          id: Number(req.params.id),
        },
      });
      return res.status(200).json({
      message:"Room deleted successfully"});
    } catch (error) {
      return res.status(400).json({ message:"Failed to delete room" });
    }
  };








module.exports = {
    createrooms,
    getAllrooms,
    updaterooms,
    deleteroom,
    getroomById

};