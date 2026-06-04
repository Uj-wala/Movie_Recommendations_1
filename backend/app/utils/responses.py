from fastapi.responses import JSONResponse


def success_response(data, status_code: int = 200):
    return JSONResponse(content={"success": True, "data": data}, status_code=status_code)


def error_response(message: str, status_code: int = 400, errors=None):
    payload = {"success": False, "message": message}
    if errors is not None:
        payload["errors"] = errors
    return JSONResponse(content=payload, status_code=status_code)
