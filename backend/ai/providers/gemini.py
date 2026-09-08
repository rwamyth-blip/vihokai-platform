from .base_provider import BaseProvider
import os
import google.generativeai as genai

class GeminiProvider(BaseProvider):
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY") or "dummy-key-for-dev"
        
        genai.configure(api_key=api_key)
        
        # ใช้โมเดลจาก .env (รองรับทั้งมี/ไม่มี models/ prefix)
        model_name = (os.getenv("GEMINI_MODEL", "models/gemini-3.1-flash-lite") or "").strip()
        if model_name.startswith("models/"):
            model_name = model_name[len("models/"):]
        self.model = genai.GenerativeModel(model_name)
        self.is_dev_mode = "dummy" in api_key

    async def generate(self, prompt: str, system_prompt: str = None, **kwargs):
        if self.is_dev_mode:
            return f"[MOCK {self.__class__.__name__}] คำตอบสำหรับ '{prompt[:80]}...'"
        
        try:
            full_prompt = prompt
            if system_prompt:
                full_prompt = f"{system_prompt}\n\n{prompt}"
            
            response = await self.model.generate_content_async(
                full_prompt,
                generation_config={
                    "temperature": kwargs.get("temperature", 0.7),
                    "max_output_tokens": kwargs.get("max_tokens", 2000)
                }
            )
            return response.text
        except Exception as e:
            return f"Error calling Gemini: {str(e)}"