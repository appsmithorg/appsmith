class HotjarUtil {

	static initializeHotjar(id: string, sv: string) {
		(function init(h: any, o: any, t: any, j: any, a?: any, r?: any) {
			h.hj =
				h.hj ||
				function() {
					(h.hj.q = h.hj.q || []).push(arguments);
				};
			h._hjSettings = { hjid: id, hjsv: sv };
			a = o.getElementsByTagName('head')[0];
			r = o.createElement('script');
			r.async = 1;
			r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
			a.appendChild(r);
		})(window, document, '//static.hotjar.com/c/hotjar-', '.js?sv=');
	};

}

export default HotjarUtil