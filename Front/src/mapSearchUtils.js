// 지도 검색 관련 유틸리티 함수들

// 주소로 좌표 검색
export const searchAddressToCoordinate = (map, address, onSuccess, onError) => {
    if (!map || !address.trim()) return;

    window.naver.maps.Service.geocode({
        query: address
    }, function(status, response) {
        if (status === window.naver.maps.Service.Status.ERROR) {
            if (onError) onError('주소 검색 중 오류가 발생했습니다.');
            return;
        }

        if (response.v2.meta.totalCount === 0) {
            if (onError) onError('검색된 주소가 없습니다.');
            return;
        }

        const item = response.v2.addresses[0];
        const latlng = new window.naver.maps.LatLng(item.y, item.x);

        if (onSuccess) {
            onSuccess({
                latlng,
                roadAddress: item.roadAddress,
                jibunAddress: item.jibunAddress,
                englishAddress: item.englishAddress,
                originalQuery: address
            });
        }
    });
};

// 좌표로 주소 검색
export const searchCoordinateToAddress = (map, latlng, onSuccess, onError) => {
    if (!map) return;

    window.naver.maps.Service.reverseGeocode({
        coords: latlng,
        orders: [
            window.naver.maps.Service.OrderType.ADDR,
            window.naver.maps.Service.OrderType.ROAD_ADDR
        ].join(',')
    }, function(status, response) {
        if (status === window.naver.maps.Service.Status.ERROR) {
            if (onError) onError('좌표 검색 중 오류가 발생했습니다.');
            return;
        }

        const items = response.v2.results;
        const addresses = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const address = makeAddress(item) || '';
            const addrType = item.name === 'roadaddr' ? '[도로명 주소]' : '[지번 주소]';
            addresses.push((i + 1) + '. ' + addrType + ' ' + address);
        }

        if (onSuccess) {
            onSuccess({
                addresses,
                coordinate: latlng
            });
        }
    });
};

// 주소 생성 함수
const makeAddress = (item) => {
    if (!item) return '';

    const name = item.name;
    const region = item.region;
    const land = item.land;
    const isRoadAddress = name === 'roadaddr';

    let sido = '', sigugun = '', dongmyun = '', ri = '', rest = '';

    if (hasArea(region.area1)) {
        sido = region.area1.name;
    }
    if (hasArea(region.area2)) {
        sigugun = region.area2.name;
    }
    if (hasArea(region.area3)) {
        dongmyun = region.area3.name;
    }
    if (hasArea(region.area4)) {
        ri = region.area4.name;
    }

    if (land) {
        if (hasData(land.number1)) {
            if (hasData(land.type) && land.type === '2') {
                rest += '산';
            }
            rest += land.number1;
            if (hasData(land.number2)) {
                rest += ('-' + land.number2);
            }
        }

        if (isRoadAddress === true) {
            if (checkLastString(dongmyun, '면')) {
                ri = land.name;
            } else {
                dongmyun = land.name;
                ri = '';
            }

            if (hasAddition(land.addition0)) {
                rest += ' ' + land.addition0.value;
            }
        }
    }

    return [sido, sigugun, dongmyun, ri, rest].join(' ').trim();
};

// 유틸리티 함수들
const hasArea = (area) => {
    return !!(area && area.name && area.name !== '');
};

const hasData = (data) => {
    return !!(data && data !== '');
};

const checkLastString = (word, lastString) => {
    return new RegExp(lastString + '$').test(word);
};

const hasAddition = (addition) => {
    return !!(addition && addition.value);
};

// InfoWindow 생성 함수
export const createSearchInfoWindow = (content, options = {}) => {
    const defaultOptions = {
        maxWidth: 300,
        backgroundColor: "#fff",
        borderColor: "#4CAF50",
        borderWidth: 2,
        anchorSize: new window.naver.maps.Size(20, 20),
        anchorColor: "#fff",
        pixelOffset: new window.naver.maps.Point(0, -10)
    };

    return new window.naver.maps.InfoWindow({
        content,
        ...defaultOptions,
        ...options
    });
};
