const express = require('express');
const PDFDocument = require('pdfkit');
const path = require('path');
const router = express.Router();

// 한글 폰트 설정 - 기본 폰트 사용

// CCTV 보고서 PDF 생성
router.post('/generate-cctv-report', (req, res) => {
    try {
        const { markerData } = req.body;
        
        // PDF 문서 생성
        const doc = new PDFDocument();
        
        // 응답 헤더 설정
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=cctv-report-${Date.now()}.pdf`);
        
        // PDF를 응답 스트림으로 파이프
        doc.pipe(res);
        
        // 한글 폰트 설정 - NanumGothic.ttf 사용
        try {
            const fontPath = path.join(__dirname, '../fonts/NanumGothic.ttf');
            doc.font(fontPath);
            console.log('✅ NanumGothic 폰트 설정 성공');
        } catch (error) {
            console.log('❌ NanumGothic 폰트 설정 실패, 기본 폰트 사용');
            doc.font('Helvetica');
        }
        
        // PDF 내용 작성 (한글 사용)
        doc.fontSize(24).text('CCTV 모니터링 보고서', { align: 'center' });
        doc.moveDown();
        
        // CCTV 기본 정보
        doc.fontSize(16).text('📹 CCTV 정보', { underline: true });
        doc.fontSize(12).text(`위치: ${markerData?.name || 'CCTV'}`);
        doc.fontSize(12).text(`좌표: ${markerData?.lat?.toFixed(6)}, ${markerData?.lng?.toFixed(6)}`);
        doc.fontSize(12).text(`생성일시: ${new Date().toLocaleString('ko-KR')}`);
        doc.moveDown();
        
        // 위험 감지 현황
        doc.fontSize(16).text('🚨 위험 감지 현황', { underline: true });
        doc.fontSize(12).text('차량 정지: 3건');
        doc.fontSize(12).text('보행자 횡단: 12건');
        doc.fontSize(12).text('교통 위반: 5건');
        doc.moveDown();
        
        // 교통량 분석
        doc.fontSize(16).text('📊 교통량 분석', { underline: true });
        doc.fontSize(12).text('시간대별 교통량: 1,234대/시간');
        doc.fontSize(12).text('평균 속도: 45km/h');
        doc.fontSize(12).text('혼잡도: 보통');
        doc.moveDown();
        
        // 위험도 점수
        doc.fontSize(16).text('위험도 점수', { underline: true });
        doc.fontSize(20).text('7.2 / 10점', { align: 'center' });
        doc.fontSize(12).text('주의 단계 (10점 만점)', { align: 'center' });
        doc.moveDown();
        
        // 권장사항
        doc.fontSize(16).text('💡 권장사항', { underline: true });
        doc.fontSize(12).text('• 교통 신호 개선 필요');
        doc.fontSize(12).text('• 보행자 횡단보도 안전장치 설치 검토');
        doc.fontSize(12).text('• 정기적인 CCTV 점검 및 유지보수');
        doc.moveDown();
        
        // 푸터
        doc.fontSize(10).text('본 보고서는 자동으로 생성되었습니다.', { align: 'center' });
        
        // PDF 완성
        doc.end();
        
    } catch (error) {
        console.error('PDF 생성 오류:', error);
        res.status(500).json({ error: 'PDF 생성 중 오류가 발생했습니다.' });
    }
});

module.exports = router;
