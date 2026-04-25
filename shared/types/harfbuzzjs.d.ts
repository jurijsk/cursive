declare module 'harfbuzzjs/hbjs' {
	import type { HarfBuzzModule } from 'harfbuzzjs/hb';

	/**
	 * Glyph information containing positioning and identity data
	 * Properties use short names as returned by HarfBuzz:
	 * - g: Glyph ID
	 * - cl: Cluster ID
	 * - ax: Advance width (X direction)
	 * - ay: Advance height (Y direction)
	 * - dx: X displacement
	 * - dy: Y displacement
	 * - flags: Glyph flags (e.g., HB_GLYPH_FLAG_UNSAFE_TO_BREAK = 0x1)
	 */
	interface GlyphInfo {
		g: number;
		cl: number;
		ax: number;
		ay: number;
		dx: number;
		dy: number;
		flags: number;
	}

	/**
	 * Direction constants for text shaping
	 */
	type HarfBuzzDirection = 'ltr' | 'rtl' | 'ttb' | 'btt';

	/**
	 * Represents a font blob (raw font data)
	 */
	interface Blob {
		ptr: number;
		destroy(): void;
	}

	/**
	 * Represents a font face (font with specific index)
	 */
	interface Face {
		ptr: number;
		upem?: number;
		getUnitsPerEM(): number;
		collectUnicodes(): Uint32Array;
		getTableScriptTags(table: 'GSUB' | 'GPOS'): string[];
		getTableFeatureTags(table: 'GSUB' | 'GPOS'): string[];
		getScriptLanguageTags(table: 'GSUB' | 'GPOS', scriptIndex: number): string[];
		getLanguageFeatureTags(table: 'GSUB' | 'GPOS', scriptIndex: number, languageIndex: number): string[];
		listNames(): Array<{ nameId: number; language: string; }>;
		getName(nameId: number, language: string): string;
		getFeatureNameIds(table: 'GSUB' | 'GPOS', featureIndex: number): {
			uiLabelNameId: number | null;
			uiTooltipTextNameId: number | null;
			sampleTextNameId: number | null;
			paramUiLabelNameIds: number[];
		} | null;
		destroy(): void;
	}

	/**
	 * Represents a shaped font instance
	 */
	interface Font {
		ptr: number;
		subFont(): Font;
		hExtents(): { ascender: number; descender: number; lineGap: number; };
		vExtents(): { ascender: number; descender: number; lineGap: number; };
		glyphName(glyphId: number): string;
		glyphToPath(glyphId: number): string;
		glyphHAdvance(glyphId: number): number;
		glyphVAdvance(glyphId: number): number;
		glyphHOrigin(glyphId: number): [number, number] | null;
		glyphVOrigin(glyphId: number): [number, number] | null;
		glyphExtents(glyphId: number): { xBearing: number; yBearing: number; width: number; height: number; } | null;
		glyphFromName(name: string): number | null;
		glyphToJson(glyphId: number): Array<{ type: string; values: number[]; }>;
		setScale(xScale: number, yScale: number): void;
		setVariations(variations: Record<string, number>): void;
		setFuncs(fontFuncs: FontFuncs): void;
		destroy(): void;
	}

	/**
	 * Font functions for custom glyph handling
	 */
	interface FontFuncs {
		ptr: number;
		setGlyphExtentsFunc(func: (font: Font, glyphId: number) => { xBearing: number; yBearing: number; width: number; height: number; } | null): void;
		setGlyphFromNameFunc(func: (font: Font, name: string) => number | null): void;
		setGlyphHAdvanceFunc(func: (font: Font, glyphId: number) => number): void;
		setGlyphVAdvanceFunc(func: (font: Font, glyphId: number) => number): void;
		setGlyphHOriginFunc(func: (font: Font, glyphId: number) => [number, number] | null): void;
		setGlyphVOriginFunc(func: (font: Font, glyphId: number) => [number, number] | null): void;
		setGlyphHKerningFunc(func: (font: Font, firstGlyph: number, secondGlyph: number) => number): void;
		setGlyphNameFunc(func: (font: Font, glyphId: number) => string | null): void;
		setNominalGlyphFunc(func: (font: Font, unicode: number) => number | null): void;
		setVariationGlyphFunc(func: (font: Font, unicode: number, variationSelector: number) => number | null): void;
		setFontHExtentsFunc(func: (font: Font) => { ascender: number; descender: number; lineGap: number; } | null): void;
		setFontVExtentsFunc(func: (font: Font) => { ascender: number; descender: number; lineGap: number; } | null): void;
	}

	/**
	 * Represents a text buffer for shaping
	 */
	interface Buffer {
		ptr: number;
		addText(text: string, itemOffset?: number, itemLength?: number): void;
		addCodePoints(codePoints: number[], itemOffset?: number, itemLength?: number): void;
		guessSegmentProperties(): void;
		setDirection(direction: HarfBuzzDirection): void;
		setFlags(flags: ('BOT' | 'EOT' | 'PRESERVE_DEFAULT_IGNORABLES' | 'REMOVE_DEFAULT_IGNORABLES' | 'DO_NOT_INSERT_DOTTED_CIRCLE' | 'PRODUCE_UNSAFE_TO_CONCAT')[]): void;
		setLanguage(language: string): void;
		setScript(script: string): void;
		setClusterLevel(level: number): void;
		json(): GlyphInfo[];
		destroy(): void;
	}

	/**
	 * HarfBuzz API object returned by the hbjs wrapper function
	 */
	interface HarfBuzzAPI {
		/**
		 * Create a blob (font data container)
		 * @param blob - Binary font data
		 * @returns Blob object
		 */
		createBlob(blob: ArrayBuffer | Uint8Array): Blob;

		/**
		 * Create a face from a blob
		 * @param blob - A blob created by createBlob
		 * @param index - Font index in the blob (usually 0)
		 * @returns Face object
		 */
		createFace(blob: Blob, index: number): Face;

		/**
		 * Create a font from a face
		 * @param face - A face created by createFace
		 * @returns Font object
		 */
		createFont(face: Face): Font;

		/**
		 * Create font functions for custom glyph handling
		 * @returns FontFuncs object
		 */
		createFontFuncs(): FontFuncs;

		/**
		 * Create a text buffer for shaping
		 * @returns Buffer object
		 */
		createBuffer(): Buffer;

		/**
		 * Shape a buffer with a given font
		 * @param font - The font to use for shaping
		 * @param buffer - The buffer to shape
		 * @param features - Comma-separated OpenType features (e.g., "liga,dlig")
		 */
		shape(font: Font, buffer: Buffer, features?: string): void;

		/**
		 * Shape a buffer with a given font, returning a trace of the shaping process
		 * @param font - The font to use for shaping
		 * @param buffer - The buffer to shape
		 * @param features - Comma-separated OpenType features
		 * @param stop_at - A lookup ID at which to terminate shaping
		 * @param stop_phase - Phase to stop at (0=don't stop, 1=GSUB, 2=GPOS)
		 * @returns Trace array
		 */
		shapeWithTrace(font: Font, buffer: Buffer, features?: string, stop_at?: number, stop_phase?: number): Array<Record<string, unknown>>;

		/**
		 * Get HarfBuzz version information
		 * @returns Version object with major, minor, micro properties
		 */
		version(): { major: number; minor: number; micro: number; };

		/**
		 * Get HarfBuzz version as a string
		 * @returns Version string
		 */
		version_string(): string;

		/**
		 * Convert OpenType script tag to HarfBuzz script
		 * @param tag - OpenType tag (e.g., "ARAB")
		 * @returns HarfBuzz script tag
		 */
		otTagToScript(tag: string): string;

		/**
		 * Convert OpenType language tag to HarfBuzz language
		 * @param tag - OpenType tag
		 * @returns HarfBuzz language
		 */
		otTagToLanguage(tag: string): string;
	}

	/**
	 * HarfBuzz wrapper function that creates and initializes the high-level API
	 * @param module - HarfBuzzModule instance returned by initHarfBuzz
	 * @returns HarfBuzzAPI object with all public methods
	 */
	function hbjs(module: HarfBuzzModule): HarfBuzzAPI;

	export default hbjs;
	export type {
		GlyphInfo,
		HarfBuzzDirection,
		Blob,
		Face,
		Font,
		FontFuncs,
		Buffer,
		HarfBuzzAPI
	};
}


/**
 * Type definitions for HarfBuzz WebAssembly module (hb.js)
 * Low-level WASM bindings for harfbuzzjs
 */

declare module 'harfbuzzjs/hb' {
	/**
	 * Module configuration options for createHarfBuzz
	 */
	interface HarfBuzzModuleOptions {
		noExitRuntime?: boolean;
		print?: (text: string) => void;
		printErr?: (text: string) => void;
		wasmBinary?: ArrayBuffer | Uint8Array;
		arguments?: string[];
		thisProgram?: string;
		preRun?: Array<() => void> | (() => void);
		postRun?: Array<() => void> | (() => void);
		preInit?: Array<() => void> | (() => void);
		locateFile?: (path: string, scriptDirectory: string) => string;
		setStatus?: (text: string) => void;
		monitorRunDependencies?: (left: number) => void;
		onAbort?: (what: string) => void;
		onRuntimeInitialized?: () => void;
		calledRun?: boolean;
	}

	/**
	 * HarfBuzz WASM Module instance
	 */
	interface HarfBuzzModule extends HarfBuzzModuleOptions {
		// Memory views
		HEAP8: Int8Array;
		HEAPU8: Uint8Array;
		HEAPU16: Uint16Array;
		HEAP32: Int32Array;
		HEAPU32: Uint32Array;
		HEAPF32: Float32Array;

		// Memory management
		wasmMemory: WebAssembly.Memory;
		wasmExports: WebAssembly.Exports;
		stackSave(): number;
		stackRestore(stackPtr: number): void;
		stackAlloc(size: number): number;
		addFunction(func: (...args: unknown[]) => unknown, sig?: string): number;
		removeFunction(funcPtr: number): void;

		// Blob functions
		_hb_blob_create(data: number, length: number, mode: number, user_data: number, destroy: number): number;
		_hb_blob_destroy(blob: number): void;
		_hb_blob_get_length(blob: number): number;
		_hb_blob_get_data(blob: number, length_ptr: number): number;

		// Buffer functions
		_hb_buffer_create(): number;
		_hb_buffer_destroy(buffer: number): void;
		_hb_buffer_get_content_type(buffer: number): number;
		_hb_buffer_set_direction(buffer: number, direction: number): void;
		_hb_buffer_set_script(buffer: number, script: number): void;
		_hb_buffer_set_language(buffer: number, language: number): void;
		_hb_buffer_set_flags(buffer: number, flags: number): void;
		_hb_buffer_set_cluster_level(buffer: number, level: number): void;
		_hb_buffer_get_length(buffer: number): number;
		_hb_buffer_get_glyph_infos(buffer: number, length_ptr: number): number;
		_hb_buffer_get_glyph_positions(buffer: number, length_ptr: number): number;
		_hb_glyph_info_get_glyph_flags(info: number): number;
		_hb_buffer_guess_segment_properties(buffer: number): void;
		_hb_buffer_add_utf8(buffer: number, text: number, text_length: number, item_offset: number, item_length: number): void;
		_hb_buffer_add_utf16(buffer: number, text: number, text_length: number, item_offset: number, item_length: number): void;
		_hb_buffer_add_codepoints(buffer: number, text: number, text_length: number, item_offset: number, item_length: number): void;
		_hb_buffer_set_message_func(buffer: number, func: number, user_data: number, destroy: number): void;
		_hb_buffer_serialize_glyphs(buffer: number, start: number, end: number, buf: number, buf_size: number, buf_consumed: number, font: number, format: number, flags: number): number;

		// Language functions
		_hb_language_from_string(str: number, len: number): number;
		_hb_language_to_string(language: number): number;

		// Script functions
		_hb_script_from_string(str: number, len: number): number;

		// Version functions
		_hb_version(major: number, minor: number, micro: number): void;
		_hb_version_string(): number;

		// Feature functions
		_hb_feature_from_string(str: number, len: number, feature: number): number;

		// Memory allocation
		_malloc(size: number): number;
		_free(ptr: number): void;

		// Draw functions
		_hb_draw_funcs_create(): number;
		_hb_draw_funcs_destroy(funcs: number): void;
		_hb_draw_funcs_set_move_to_func(funcs: number, func: number, user_data: number, destroy: number): void;
		_hb_draw_funcs_set_line_to_func(funcs: number, func: number, user_data: number, destroy: number): void;
		_hb_draw_funcs_set_quadratic_to_func(funcs: number, func: number, user_data: number, destroy: number): void;
		_hb_draw_funcs_set_cubic_to_func(funcs: number, func: number, user_data: number, destroy: number): void;
		_hb_draw_funcs_set_close_path_func(funcs: number, func: number, user_data: number, destroy: number): void;

		// Face functions
		_hb_face_create(blob: number, index: number): number;
		_hb_face_destroy(face: number): void;
		_hb_face_reference_table(face: number, tag: number): number;
		_hb_face_get_upem(face: number): number;
		_hb_face_collect_unicodes(face: number, out: number): void;

		// Font functions
		_hb_font_create(face: number): number;
		_hb_font_create_sub_font(parent: number): number;
		_hb_font_reference(font: number): number;
		_hb_font_destroy(font: number): void;
		_hb_font_set_funcs(font: number, funcs: number, user_data: number, destroy: number): void;
		_hb_font_set_scale(font: number, x_scale: number, y_scale: number): void;
		_hb_font_set_variations(font: number, variations: number, variations_length: number): void;
		_hb_font_get_h_extents(font: number, extents: number): number;
		_hb_font_get_v_extents(font: number, extents: number): number;
		_hb_font_get_glyph_h_advance(font: number, glyph: number): number;
		_hb_font_get_glyph_v_advance(font: number, glyph: number): number;
		_hb_font_get_glyph_h_origin(font: number, glyph: number, x: number, y: number): number;
		_hb_font_get_glyph_v_origin(font: number, glyph: number, x: number, y: number): number;
		_hb_font_get_glyph_extents(font: number, glyph: number, extents: number): number;
		_hb_font_get_glyph_from_name(font: number, name: number, len: number, glyph: number): number;
		_hb_font_draw_glyph(font: number, glyph: number, funcs: number, user_data: number): void;
		_hb_font_glyph_to_string(font: number, glyph: number, s: number, size: number): void;

		// Font funcs
		_hb_font_funcs_create(): number;
		_hb_font_funcs_destroy(funcs: number): void;
		_hb_font_funcs_set_font_h_extents_func(funcs: number, func: number, user_data: number, destroy: number): void;
		_hb_font_funcs_set_font_v_extents_func(funcs: number, func: number, user_data: number, destroy: number): void;
		_hb_font_funcs_set_nominal_glyph_func(funcs: number, func: number, user_data: number, destroy: number): void;
		_hb_font_funcs_set_nominal_glyphs_func(funcs: number, func: number, user_data: number, destroy: number): void;
		_hb_font_funcs_set_variation_glyph_func(funcs: number, func: number, user_data: number, destroy: number): void;
		_hb_font_funcs_set_glyph_h_advance_func(funcs: number, func: number, user_data: number, destroy: number): void;
		_hb_font_funcs_set_glyph_v_advance_func(funcs: number, func: number, user_data: number, destroy: number): void;
		_hb_font_funcs_set_glyph_h_advances_func(funcs: number, func: number, user_data: number, destroy: number): void;
		_hb_font_funcs_set_glyph_v_advances_func(funcs: number, func: number, user_data: number, destroy: number): void;
		_hb_font_funcs_set_glyph_h_origin_func(funcs: number, func: number, user_data: number, destroy: number): void;
		_hb_font_funcs_set_glyph_v_origin_func(funcs: number, func: number, user_data: number, destroy: number): void;
		_hb_font_funcs_set_glyph_h_kerning_func(funcs: number, func: number, user_data: number, destroy: number): void;
		_hb_font_funcs_set_glyph_extents_func(funcs: number, func: number, user_data: number, destroy: number): void;
		_hb_font_funcs_set_glyph_name_func(funcs: number, func: number, user_data: number, destroy: number): void;
		_hb_font_funcs_set_glyph_from_name_func(funcs: number, func: number, user_data: number, destroy: number): void;

		// OpenType layout functions
		_hb_ot_layout_table_get_script_tags(face: number, table_tag: number, start_offset: number, script_count: number, script_tags: number): number;
		_hb_ot_layout_table_get_feature_tags(face: number, table_tag: number, start_offset: number, feature_count: number, feature_tags: number): number;
		_hb_ot_layout_script_get_language_tags(face: number, table_tag: number, script_index: number, start_offset: number, language_count: number, language_tags: number): number;
		_hb_ot_layout_language_get_feature_tags(face: number, table_tag: number, script_index: number, language_index: number, start_offset: number, feature_count: number, feature_tags: number): number;
		_hb_ot_layout_feature_get_name_ids(face: number, table_tag: number, feature_index: number, label_id: number, tooltip_id: number, sample_id: number, num_named_parameters: number, first_param_id: number): number;

		// OpenType name functions
		_hb_ot_name_list_names(face: number, num_entries: number): number;
		_hb_ot_name_get_utf16(face: number, name_id: number, text: number, text_size: number): number;

		// Set functions
		_hb_set_create(): number;
		_hb_set_destroy(set: number): void;
		_hb_set_get_population(set: number): number;
		_hb_set_next_many(set: number, codepoint: number, out: number, size: number): number;

		// OpenType tag conversion
		_hb_ot_tag_to_script(tag: number): number;
		_hb_ot_tag_to_language(tag: number): number;

		// OpenType variations
		_hb_ot_var_get_axis_infos(face: number, start_offset: number, axes_count: number, axes_array: number): number;

		// Shape function
		_hb_shape(font: number, buffer: number, features: number, num_features: number): void;
	}

	/**
	 * Factory function that creates and initializes the HarfBuzz WASM module
	 */
	async function createHarfBuzz(options?: HarfBuzzModuleOptions): Promise<HarfBuzzModule>;

	export = createHarfBuzz;
	export type { HarfBuzzModule, HarfBuzzModuleOptions };
}
