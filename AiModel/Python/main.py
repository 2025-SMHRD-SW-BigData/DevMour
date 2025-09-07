
#!/usr/bin/env python3
"""
AI 도로 위험도 분석 시스템 메인 실행 파일
"""

import asyncio
import logging
import sys
from pathlib import Path

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from config import SERVER_CONFIG
from ai_server import app
import uvicorn

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('ai_system.log', encoding='utf-8')
    ]
)

logger = logging.getLogger(__name__)

def main():
    """메인 함수"""
    try:
        logger.info("🚀 AI 도로 위험도 분석 시스템 시작")
        logger.info(f"서버 설정: {SERVER_CONFIG['host']}:{SERVER_CONFIG['port']}")
        
        # uvicorn 서버 실행
        uvicorn.run(
            "ai_server:app",
            host=SERVER_CONFIG['host'],
            port=SERVER_CONFIG['port'],
            reload=SERVER_CONFIG['debug'],
            log_level="info"
        )
        
    except KeyboardInterrupt:
        logger.info("🛑 사용자에 의해 서버가 중지되었습니다")
    except Exception as e:
        logger.error(f"❌ 서버 실행 중 오류 발생: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
