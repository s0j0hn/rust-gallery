import PhotoSwipeLightbox from './5.4.4_photoswipe-lightbox.esm.js';
import axios from "./axios.js";

document.addEventListener('DOMContentLoaded', () => {
    const lightbox = new PhotoSwipeLightbox({
        bgOpacity: 1,
        gallery: '#my-gallery',
        children: 'a',
        preload: [2, 4],
        loop: false,
        close: false,
        pinchToClose: false,
        closeOnVerticalDrag: false,
        escKey: false,
        mainClass: 'pswp-with-perma-preloader',
        pswpModule: () => import('./photoswipe.esm.js')
    });

    // Cache for DOM elements to avoid repeated queries
    const getImageData = (currSlide) => {
        if (!currSlide || !currSlide.data || !currSlide.data.element) return null;

        const img = currSlide.data.element.querySelector('img');
        if (!img) return null;

        return {
            tags: img.getAttribute('data-pswp-tags'),
            folder: img.getAttribute('data-pswp-folder'),
            fileName: img.getAttribute('alt'),
            hash: img.getAttribute('data-pswp-hash')
        };
    };

    // Parse tags with error handling
    const parseTags = (tagsStr) => {
        try {
            return JSON.parse(tagsStr);
        } catch (e) {
            console.error('Error parsing tags:', e);
            return ["error_tags"];
        }
    };

    // Handle UI registration in one place
    lightbox.on('uiRegister', () => {
        // Download Button
        lightbox.pswp.ui.registerElement({
            name: 'download-button',
            order: 8,
            isButton: true,
            tagName: 'a',
            html: {
                isCustomSVG: true,
                inner: '<path d="M20.5 14.3 17.1 18V10h-2.2v7.9l-3.4-3.6L10 16l6 6.1 6-6.1ZM23 23H9v2h14Z" id="pswp__icn-download"/>',
                outlineID: 'pswp__icn-download'
            },
            onInit: (el, pswp) => {
                el.setAttribute('download', '');
                el.setAttribute('target', '_blank');
                el.setAttribute('rel', 'noopener');

                pswp.on('change', () => {
                    if (pswp.currSlide && pswp.currSlide.data) {
                        el.href = pswp.currSlide.data.src;
                        el.download = pswp.currSlide.data.alt;
                    }
                });
            }
        });

        // Custom Caption
        lightbox.pswp.ui.registerElement({
            name: 'custom-caption',
            order: 9,
            isButton: false,
            appendTo: 'root',
            html: '',
            onInit: (el, pswp) => {
                // Set styles once instead of on each change
                Object.assign(el.style, {
                    position: 'absolute',
                    bottom: '15px',
                    left: '0',
                    right: '0',
                    padding: '0 20px',
                    color: 'var(--pswp-icon-color)',
                    textAlign: 'center',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    textShadow: '1px 1px 3px var(--pswp-icon-color-secondary)'
                });

                pswp.on('change', () => {
                    const imageData = getImageData(pswp.currSlide);
                    if (!imageData) {
                        el.innerHTML = '';
                        return;
                    }

                    const currSlideElement = pswp.currSlide.data.element;
                    const hiddenCaption = currSlideElement?.querySelector('.hidden-caption-content');

                    if (hiddenCaption) {
                        el.innerHTML = hiddenCaption.innerHTML;
                    } else {
                        const tags = parseTags(imageData.tags);
                        const dimensions = `${pswp.currSlide.data.h}x${pswp.currSlide.data.w}`;
                        el.innerHTML = `${imageData.folder} - ${imageData.fileName} (${dimensions}) - ${tags}`;
                    }
                });
            }
        });

        // Tags Button
        lightbox.pswp.ui.registerElement({
            name: 'tags-button',
            order: 10,
            isButton: true,
            html: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" class="pswp__icn">' +
                '<path d="M 17.5 2 C 16.375 2 15.468589 2.4398778 14.876953 3.1054688 C 14.285317 3.7710596 14 4.6388889 14 5.5 C 14 6.2436399 14.226926 6.9844309 14.666016 7.6035156 L 12.242188 11 L 8.8164062 11 C 8.7215589 10.323705 8.5911059 9.6320352 8.1230469 9.1054688 C 7.5314107 8.4398777 6.6249996 8 5.5 8 C 4.3750004 8 3.4685893 8.4398777 2.8769531 9.1054688 C 2.285317 9.7710596 2 10.638889 2 11.5 C 2 12.361111 2.285317 13.22894 2.8769531 13.894531 C 3.4685893 14.560122 4.3750004 15 5.5 15 C 6.6249996 15 7.5314107 14.560122 8.1230469 13.894531 C 8.5911059 13.367965 8.7215589 12.676295 8.8164062 12 L 12.242188 12 L 14.666016 15.396484 C 14.226926 16.015569 14 16.75636 14 17.5 C 14 18.361111 14.285317 19.22894 14.876953 19.894531 C 15.468589 20.560122 16.375 21 17.5 21 C 18.625 21 19.531411 20.560122 20.123047 19.894531 C 20.714683 19.22894 21 18.361111 21 17.5 C 21 16.638889 20.714683 15.77106 20.123047 15.105469 C 19.531411 14.439878 18.625 14 17.5 14 C 16.651661 14 15.929594 14.251729 15.371094 14.660156 L 13.115234 11.5 L 15.371094 8.3398438 C 15.929594 8.7482711 16.651661 9 17.5 9 C 18.625 9 19.531411 8.5601222 20.123047 7.8945312 C 20.714683 7.2289403 21 6.3611111 21 5.5 C 21 4.6388889 20.714683 3.7710596 20.123047 3.1054688 C 19.531411 2.4398777 18.625 2 17.5 2 z M 17.5 3 C 18.375 3 18.96859 3.3101223 19.376953 3.7695312 C 19.785317 4.2289404 20 4.8611111 20 5.5 C 20 6.1388889 19.785317 6.7710597 19.376953 7.2304688 C 18.96859 7.6898777 18.375 8 17.5 8 C 16.625 8 16.03141 7.6898778 15.623047 7.2304688 C 15.214683 6.7710597 15 6.1388889 15 5.5 C 15 4.8611111 15.214683 4.2289404 15.623047 3.7695312 C 16.03141 3.3101223 16.625 3 17.5 3 z M 5.5 9 C 6.3749995 9 6.9685897 9.3101223 7.3769531 9.7695312 C 7.7807957 10.223854 7.9894282 10.848823 7.9941406 11.480469 A 0.50005 0.50005 0 0 0 7.9921875 11.519531 C 7.9873275 12.150941 7.7806488 12.776311 7.3769531 13.230469 C 6.9685866 13.68988 6.3749995 14 5.5 14 C 4.6250005 14 4.0314103 13.689878 3.6230469 13.230469 C 3.2146835 12.77106 3 12.138889 3 11.5 C 3 10.861111 3.2146835 10.22894 3.6230469 9.7695312 C 4.0314103 9.3101223 4.6250005 9 5.5 9 z M 17.5 15 C 18.375 15 18.96859 15.310122 19.376953 15.769531 C 19.785317 16.22894 20 16.861111 20 17.5 C 20 18.138889 19.785317 18.77106 19.376953 19.230469 C 18.96859 19.689878 18.375 20 17.5 20 C 16.625 20 16.03141 19.689878 15.623047 19.230469 C 15.214683 18.77106 15 18.138889 15 17.5 C 15 16.861111 15.214683 16.22894 15.623047 15.769531 C 16.03141 15.310122 16.625 15 17.5 15 z"></path>\n' +
                '</svg>',
            onClick: (event, el, pswp) => {
                const imageData = getImageData(pswp.currSlide);
                if (!imageData) return;

                const tags = parseTags(imageData.tags);
                const promptTags = prompt("(Separate by comma \"tag , tag\") - Please add your tag:", tags.toString());

                if (!promptTags) {
                    console.log("Adding tags cancelled");
                    return;
                }

                const newTags = promptTags.trim().split(",").map(tag => tag.trim());

                axios.post('/tags/assign', {
                    image_hash: imageData.hash,
                    tags: newTags
                }, {
                    headers: { 'Content-Type': 'application/json' }
                })
                    .then(response => console.log('Tags updated:', response))
                    .catch(error => console.error('Error updating tags:', error.message));
            },
        });
    });

    // Additional event handlers
    lightbox.addFilter('numItems', (numItems) => {
        if (numItems === 0) {
            window.location.href = "/beta";
            return numItems;
        }
        return numItems + 1;
    });

    lightbox.on('contentActivate', ({content}) => {
        if (content.index === lightbox.getNumItems() - 1) {
            location.reload();
        }
    });

    // WebP support with performance optimizations
    lightbox.on('contentLoad', (e) => {
        const {content, isLazy} = e;

        if (!content.data.webpSrc) return;

        // Prevent default and implement custom loading
        e.preventDefault();

        // Create elements only once
        const pictureElement = document.createElement('picture');
        const sourceWebp = document.createElement('source');
        const sourceJpg = document.createElement('source');
        const imgElement = document.createElement('img');

        // Configure sources
        sourceWebp.srcset = content.data.webpSrc;
        sourceWebp.type = 'image/webp';

        sourceJpg.srcset = content.data.src;
        sourceJpg.type = 'image/jpeg';

        // Configure image
        imgElement.src = content.data.src;
        imgElement.alt = '';
        imgElement.className = 'pswp__img';

        // Build the picture element
        pictureElement.appendChild(sourceWebp);
        pictureElement.appendChild(sourceJpg);
        pictureElement.appendChild(imgElement);

        // Store references
        content.pictureElement = pictureElement;
        content.element = imgElement;
        content.state = 'loading';

        // Handle loading states
        if (imgElement.complete) {
            content.onLoaded();
        } else {
            imgElement.onload = () => content.onLoaded();
            imgElement.onerror = () => content.onError();
        }
    });

    // URL modifications
    lightbox.addFilter('itemData', (itemData) => {
        if (!itemData || !itemData.src) return itemData;

        return {
            ...itemData,
            src: `${itemData.src}/download`,
            msrc: itemData.msrc ? `${itemData.msrc}/download` : undefined,
        };
    });

    // Close handling
    lightbox.on('close', () => location.reload());

    // Initialize and open
    lightbox.init();
    lightbox.loadAndOpen(0);
});