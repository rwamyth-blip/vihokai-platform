import os
import logging
from openai import AsyncOpenAI

# ตั้งค่า logging
logger = logging.getLogger(__name__)

class MetaAIProvider:
    def __init__(self):
        # ใช้ dummy key กัน crash ตอน dev
        api_key = os.getenv("GROQ_API_KEY") or os.getenv("OPENAI_API_KEY") or "dummy-key-for-dev"
        base_url = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
        
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url=base_url
        )
        self.model = (
            os.getenv("META_AI_MODEL")
            or os.getenv("GROQ_MODEL")
            or os.getenv("GROQ_AI_MODEL")
            or "qwen/qwen3.8-27b"
        )
        # กันค่า model ที่ไม่ใช่ model id จริง (เช่น ชื่อผลิตภัณฑ์ที่มีช่องว่าง)
        if " " in self.model:
            logger.warning(f"META_AI_MODEL '{self.model}' is not a valid model id — using default")
            self.model = "qwen/qwen3.8-27b"
        
        # ตรวจสอบว่าใช้โหมด dev หรือไม่
        self.is_dev_mode = "dummy" in self.client.api_key
        
        if self.is_dev_mode:
            logger.warning("Running in DEV mode with dummy API key")
        else:
            logger.info(f"Meta AI initialized with model: {self.model}")

    async def generate(self, prompt: str, **kwargs):
        """
        สร้างคำตอบจาก Meta AI (Llama 3.3 70B ผ่าน Groq)
        
        Args:
            prompt (str): คำถามหรือข้อความที่ต้องการให้ AI ตอบ
            **kwargs: พารามิเตอร์เพิ่มเติม เช่น temperature, max_tokens
        
        Returns:
            str: คำตอบจาก AI หรือข้อความ error
        """
        # ถ้าเป็น dummy key ให้ตอบ mock ไปก่อน จะได้ไม่ crash
        if self.is_dev_mode:
            return f"[DEV MODE ViHok AI] Mock answer for: {prompt[:150]}... (ใส่ GROQ_API_KEY จริงใน .env เพื่อได้คำตอบจริง)"
        
        try:
            # เพดาน output กัน Groq 429 (OTPM limit ของ org ค่อนข้างต่ำ)
            ceiling = int(os.getenv("META_AI_MAX_TOKENS", "900"))
            max_tokens = min(int(kwargs.get("max_tokens", ceiling)), ceiling)

            # ใช้ system_prompt ที่ส่งมา ถ้ามี
            system_prompt = kwargs.get("system_prompt") or (
                "You are a helpful AI assistant named ViHok AI. "
                "You provide accurate, helpful, and thoughtful responses."
            )

            # สร้าง completion request
            completion = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt},
                ],
                temperature=kwargs.get("temperature", 0.7),
                max_tokens=max_tokens,
                top_p=kwargs.get("top_p", 1.0),
                frequency_penalty=kwargs.get("frequency_penalty", 0.0),
                presence_penalty=kwargs.get("presence_penalty", 0.0)
            )
            
            # ดึงข้อความตอบกลับ
            response = completion.choices[0].message.content
            
            # log การใช้งาน (เฉพาะในโหมด debug)
            logger.debug(f"Generated response of length: {len(response)} characters")
            
            return response
            
        except Exception as e:
            # จัดการข้อผิดพลาด
            error_msg = f"Error calling Meta AI: {str(e)}"
            logger.error(error_msg)
            return error_msg

    async def generate_stream(self, prompt: str, **kwargs):
        """
        สร้างคำตอบแบบ streaming จาก Meta AI
        
        Args:
            prompt (str): คำถามหรือข้อความ
            **kwargs: พารามิเตอร์เพิ่มเติม
        
        Yields:
            str: ส่วนของคำตอบทีละชิ้น
        """
        if self.is_dev_mode:
            yield f"[DEV MODE] Streaming mock response for: {prompt[:50]}..."
            return
        
        try:
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful AI assistant named ViHok AI."},
                    {"role": "user", "content": prompt}
                ],
                temperature=kwargs.get("temperature", 0.7),
                max_tokens=kwargs.get("max_tokens", 2000),
                stream=True
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            error_msg = f"Error in streaming: {str(e)}"
            logger.error(error_msg)
            yield error_msg