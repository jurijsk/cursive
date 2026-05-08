import type { RouterConfig } from '@nuxt/schema';

export default <RouterConfig>{
	scrollBehavior(to, from, savedPosition) {
		if(savedPosition) return savedPosition;

		// Keep scroll position when only params change on the same route
		// (e.g. selecting example chips updates /:text via router.replace).
		if(to.name === from.name) return false;

		if(to.hash) return { el: to.hash, top: 0 };

		return { left: 0, top: 0 };
	}
};
