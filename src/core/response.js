const statusEnum  =Object.freeze({
    "SUCCESS":200,
    "BAD_REQUEST":400,
    "UNAUTHORIZED" : 401,
    "FORBIDDEN" :403,
    "NOT_FOUND" : 404,
    "INTERNAL_ERROR" : 500,
})

class ApiResponse{   
    send(res){
        return res.status(this.statusResponse).json({...this})
    }
}

class SuccessResponse extends ApiResponse{
    constructor(message, data = null){
        super()
        this.message = message
        this.data = data
        this.statusResponse = statusEnum.SUCCESS
    }
}

class BadRequestResponse extends ApiResponse{
    constructor(message, data = null){
        super()
        this.message = message
        this.data = data
        this.statusResponse = statusEnum.BAD_REQUEST
    }
}

class UnauthorizedResponse extends ApiResponse{
    constructor(message, data = null){
        super()
        this.message = message
        this.data = data
        this.statusResponse = statusEnum.UNAUTHORIZED
    }
}

class NotFoundResponse extends ApiResponse{
    constructor(message, data = null){
        super()
        this.message = message
        this.data = data
        this.statusResponse = statusEnum.NOT_FOUND
    }
}


module.exports = {SuccessResponse, BadRequestResponse, UnauthorizedResponse, NotFoundResponse}

