import sys
try:
    from app.services.chatbot_service import chatbot_service
    print("Import successful!")
except Exception as e:
    import traceback
    traceback.print_exc()
