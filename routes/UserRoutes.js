const express = require('express')
const { RegisterUser, LoginUser, EditProfile, GetProfile, GetAllProfiles, SendRequest, AcceptRequest, RejectRequest, GetSentRequests, GetReceivedRequests, GetAllConnections, DeleteProfile } = require('../controllers/UsersControllers')
const { verifyToken } = require('../config/jwtToken')
const router = express.Router()

router.post('/register',RegisterUser)

router.post('/login',LoginUser)

router.put('/edit',verifyToken,EditProfile)

router.delete('/delete',verifyToken,DeleteProfile)


router.get('/profile',verifyToken,GetProfile)

router.get('/all',GetAllProfiles)

router.post('/send-request',verifyToken,SendRequest)

router.post('/request/accept',verifyToken,AcceptRequest)

router.post('/request/reject',verifyToken,RejectRequest)

router.get('/sent-requests',verifyToken,GetSentRequests)

router.get('/received-requests',verifyToken,GetReceivedRequests)

router.get('/all-connections',verifyToken,GetAllConnections)

module.exports = router