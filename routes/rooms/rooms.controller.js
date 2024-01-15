const { getPagination } = require("../../utils/query");
const prisma = require("../../utils/prisma");

//create single room
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
//get all romms
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
  //update single room byid
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
  //get single room byis
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
  //get room by locationid
  const getroomBylocationId = async (req, res) => {
    try {
      const locationId = Number(req.params.id);
      const statusFilter = req.query.status === "true";
  
      const rooms = await prisma.room.findMany({
        where: {
          locationId: locationId,
          status: statusFilter, 
        },
        select: {
          id: true,
          roomName: true,
          status: true,
          location: {
            select: {
              id: true,
              locationName: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      });
  
      if (rooms.length === 0) {
        return res.status(400).json({ message: "No rooms found with the specified location." });
      }
  
      return res.status(200).json(rooms);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  };
  //delete single room byid
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
    getroomById,
    getroomBylocationId

};