import os
import logging
from openai import AsyncOpenAI

# ตั้งค่า logging
logger = logging.getLogger(__name__)

class MetaAIProvider:
    """Meta AI ผ่าน api.meta.ai (Muse Spark) — model ตาม MUSE_AI_MODEL (default muse-spark-1.1).
    เดิมใช้ Groq-hosted gpt-oss (เพราะตอนนั้น Meta ไม่มี public API) — ตอนนี้มีแล้วจึงยิงตรง."""

    def __init__(self):
        self.base_url = (os.getenv("MUSE_BASE_URL", "https://api.meta.ai/v1") or "").strip().rstrip("/")
        self.model = (os.getenv("MUSE_AI_MODEL") or os.getenv("META_AI_MODEL") or "muse-spark-1.1").strip()
        # กันค่าที่ไม่ใช่ model id จริง (เช่น ชื่อผลิตภัณฑ์ที่มีช่องว่าง)
        if not self.model or " " in self.model or "/" in self.model and "muse-" not in self.model:
            if " " in self.model:
                logger.warning(f"MUSE model '{self.model}' is not a valid model id — using default")
            self.model = "muse-spark-1.1" if (" " in self.model or not self.model) else self.model

        api_key = os.getenv("MUSE_API_KEY") or os.getenv("META_API_KEY") or "dummy-key-for-dev"
        self.client = AsyncOpenAI(api_key=api_key, base_url=self.base_url)

        # ตรวจสอบว่าใช้โหมด dev หรือไม่
        self.is_dev_mode = "dummy" in self.client.api_key

        if self.is_dev_mode:
            logger.warning("Running in DEV mode with dummy API key")
        else:
            logger.info(f"Meta AI (Muse Spark) initialized with model: {self.model}")

    async def generate(self, prompt: str, **kwargs):
        """
        สร้างคำตอบจาก Muse Spark ผ่าน api.meta.ai

        Args:
            prompt (str): คำถามหรือข้อความที่ต้องการให้ AI ตอบ
            **kwargs: พารามิเตอร์เพิ่มเติม เช่น temperature, max_tokens

        Returns:
            str: คำตอบจาก AI หรือข้อความ error
        """
        # ถ้าเป็น dummy key ให้ตอบ mock ไปก่อน จะได้ไม่ crash
        if self.is_dev_mode:
            return f"[DEV MODE ViHok AI] Mock answer for: {prompt[:150]}... (ใส่ MUSE_API_KEY จริงใน .env เพื่อได้คำตอบจริง)"

        try:
            # Muse: max_tokens ต่ำกว่า 1500 จะคืน content ว่าง (finish=length) → clamp ขั้นต่ำ
            ceiling = int(os.getenv("MUSE_MAX_TOKENS", "4000"))
            want = int(kwargs.get("max_tokens", ceiling))
            max_tokens = max(1500, min(want, ceiling))

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