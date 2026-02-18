import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'

const extractMessage = (exception: HttpException | Error | unknown) => {
  if (exception instanceof HttpException) {
    const payload = exception.getResponse()
    if (typeof payload === 'string') {
      return payload
    }
    if (payload && typeof payload === 'object' && 'message' in payload) {
      const message = (payload as { message?: string | string[] }).message
      if (Array.isArray(message)) {
        return message.join(', ')
      }
      if (typeof message === 'string') {
        return message
      }
    }
    return exception.message
  }

  if (exception instanceof Error) {
    return exception.message
  }

  return '서버 내부 오류가 발생했습니다.'
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp()
    const response = context.getResponse<{ status: (code: number) => { send: (body: unknown) => void } }>()
    const request = context.getRequest<{ id?: string; url?: string }>()

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    const payload = {
      success: false,
      statusCode: status,
      code:
        exception instanceof HttpException
          ? exception.name.toUpperCase()
          : 'INTERNAL_SERVER_ERROR',
      message: extractMessage(exception),
      traceId: request.id,
      path: request.url,
      timestamp: new Date().toISOString()
    }

    response.status(status).send(payload)
  }
}

