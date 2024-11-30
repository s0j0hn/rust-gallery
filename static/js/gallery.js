import PhotoSwipeLightbox from './5.4.4_photoswipe-lightbox.esm.js';
import axios from "./axios.js"
window.addEventListener('DOMContentLoaded', function () {
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

    lightbox.on('uiRegister', function () {
        lightbox.pswp.ui.registerElement({
            name: 'download-button',
            order: 8,
            isButton: true,
            tagName: 'a',

            // SVG with outline
            html: {
                isCustomSVG: true,
                inner: '<path d="M20.5 14.3 17.1 18V10h-2.2v7.9l-3.4-3.6L10 16l6 6.1 6-6.1ZM23 23H9v2h14Z" id="pswp__icn-download"/>',
                outlineID: 'pswp__icn-download'
            },

            // Or provide full svg:
            // html: '<svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" class="pswp__icn"><path d="M20.5 14.3 17.1 18V10h-2.2v7.9l-3.4-3.6L10 16l6 6.1 6-6.1ZM23 23H9v2h14Z" /></svg>',

            // Or provide any other markup:
            // html: '<i class="fa-solid fa-download"></i>'

            onInit: (el, pswp) => {
                el.setAttribute('download', '');
                el.setAttribute('target', '_blank');
                el.setAttribute('rel', 'noopener');

                pswp.on('change', () => {
                    // console.log(pswp.currSlide.data);
                    el.href = pswp.currSlide.data.src;
                    el.download = pswp.currSlide.data.alt;
                });
            }
        });

        lightbox.pswp.ui.registerElement({
            name: 'custom-caption',
            order: 9,
            isButton: false,
            appendTo: 'root',
            html: 'Caption text',
            onInit: (el, pswp) => {
                lightbox.pswp.on('change', () => {
                    el.style.position = 'absolute'
                    el.style.bottom = '15px'
                    el.style.left = '0'
                    el.style.right = '0'
                    el.style.padding = '0 20px'
                    el.style.color = 'var(--pswp-icon-color)'
                    el.style.textAlign = 'center'
                    el.style.fontSize = '14px'
                    el.style.lineHeight = '1.5'
                    el.style.textShadow =
                        '1px 1px 3px var(--pswp-icon-color-secondary)'

                    const currSlideElement = lightbox.pswp.currSlide.data.element;
                    let captionHTML = '';
                    if (currSlideElement) {
                        const hiddenCaption = currSlideElement.querySelector('.hidden-caption-content');
                        if (hiddenCaption) {
                            // get caption from element with class hidden-caption-content
                            captionHTML = hiddenCaption.innerHTML;
                        } else {
                            // get caption from alt attribute
                            const tags = currSlideElement.querySelector('img').getAttribute('data-pswp-tags');
                            const folder_name = currSlideElement.querySelector('img').getAttribute('data-pswp-folder');
                            const file_name = currSlideElement.querySelector('img').getAttribute('alt')
                            let json_tags;
                            try {
                                json_tags = JSON.parse(tags)
                            } catch (e) {
                                console.error(e)
                                json_tags = ["error_tags"]
                            }
                            captionHTML = `${folder_name} - ${file_name} (${pswp.currSlide.data.h}x${pswp.currSlide.data.w}) - ${json_tags}`;
                        }
                    }
                    el.innerHTML = captionHTML || '';
                });
            }
        });

        lightbox.pswp.ui.registerElement({
            name: 'tags-button',
            order: 10,
            isButton: true,

            // SVG with outline
            html: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" class="pswp__icn">\n' +
                '<path d="M 17.5 2 C 16.375 2 15.468589 2.4398778 14.876953 3.1054688 C 14.285317 3.7710596 14 4.6388889 14 5.5 C 14 6.2436399 14.226926 6.9844309 14.666016 7.6035156 L 12.242188 11 L 8.8164062 11 C 8.7215589 10.323705 8.5911059 9.6320352 8.1230469 9.1054688 C 7.5314107 8.4398777 6.6249996 8 5.5 8 C 4.3750004 8 3.4685893 8.4398777 2.8769531 9.1054688 C 2.285317 9.7710596 2 10.638889 2 11.5 C 2 12.361111 2.285317 13.22894 2.8769531 13.894531 C 3.4685893 14.560122 4.3750004 15 5.5 15 C 6.6249996 15 7.5314107 14.560122 8.1230469 13.894531 C 8.5911059 13.367965 8.7215589 12.676295 8.8164062 12 L 12.242188 12 L 14.666016 15.396484 C 14.226926 16.015569 14 16.75636 14 17.5 C 14 18.361111 14.285317 19.22894 14.876953 19.894531 C 15.468589 20.560122 16.375 21 17.5 21 C 18.625 21 19.531411 20.560122 20.123047 19.894531 C 20.714683 19.22894 21 18.361111 21 17.5 C 21 16.638889 20.714683 15.77106 20.123047 15.105469 C 19.531411 14.439878 18.625 14 17.5 14 C 16.651661 14 15.929594 14.251729 15.371094 14.660156 L 13.115234 11.5 L 15.371094 8.3398438 C 15.929594 8.7482711 16.651661 9 17.5 9 C 18.625 9 19.531411 8.5601222 20.123047 7.8945312 C 20.714683 7.2289403 21 6.3611111 21 5.5 C 21 4.6388889 20.714683 3.7710596 20.123047 3.1054688 C 19.531411 2.4398777 18.625 2 17.5 2 z M 17.5 3 C 18.375 3 18.96859 3.3101223 19.376953 3.7695312 C 19.785317 4.2289404 20 4.8611111 20 5.5 C 20 6.1388889 19.785317 6.7710597 19.376953 7.2304688 C 18.96859 7.6898777 18.375 8 17.5 8 C 16.625 8 16.03141 7.6898778 15.623047 7.2304688 C 15.214683 6.7710597 15 6.1388889 15 5.5 C 15 4.8611111 15.214683 4.2289404 15.623047 3.7695312 C 16.03141 3.3101223 16.625 3 17.5 3 z M 5.5 9 C 6.3749995 9 6.9685897 9.3101223 7.3769531 9.7695312 C 7.7807957 10.223854 7.9894282 10.848823 7.9941406 11.480469 A 0.50005 0.50005 0 0 0 7.9921875 11.519531 C 7.9873275 12.150941 7.7806488 12.776311 7.3769531 13.230469 C 6.9685866 13.68988 6.3749995 14 5.5 14 C 4.6250005 14 4.0314103 13.689878 3.6230469 13.230469 C 3.2146835 12.77106 3 12.138889 3 11.5 C 3 10.861111 3.2146835 10.22894 3.6230469 9.7695312 C 4.0314103 9.3101223 4.6250005 9 5.5 9 z M 17.5 15 C 18.375 15 18.96859 15.310122 19.376953 15.769531 C 19.785317 16.22894 20 16.861111 20 17.5 C 20 18.138889 19.785317 18.77106 19.376953 19.230469 C 18.96859 19.689878 18.375 20 17.5 20 C 16.625 20 16.03141 19.689878 15.623047 19.230469 C 15.214683 18.77106 15 18.138889 15 17.5 C 15 16.861111 15.214683 16.22894 15.623047 15.769531 C 16.03141 15.310122 16.625 15 17.5 15 z"></path>\n' +
                '</svg>',
            //html: '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" ><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M18.18 8.03933L18.6435 7.57589C19.4113 6.80804 20.6563 6.80804 21.4241 7.57589C22.192 8.34374 22.192 9.58868 21.4241 10.3565L20.9607 10.82M18.18 8.03933C18.18 8.03933 18.238 9.02414 19.1069 9.89309C19.9759 10.762 20.9607 10.82 20.9607 10.82M18.18 8.03933L13.9194 12.2999C13.6308 12.5885 13.4865 12.7328 13.3624 12.8919C13.2161 13.0796 13.0906 13.2827 12.9882 13.4975C12.9014 13.6797 12.8368 13.8732 12.7078 14.2604L12.2946 15.5L12.1609 15.901M20.9607 10.82L16.7001 15.0806C16.4115 15.3692 16.2672 15.5135 16.1081 15.6376C15.9204 15.7839 15.7173 15.9094 15.5025 16.0118C15.3203 16.0986 15.1268 16.1632 14.7396 16.2922L13.5 16.7054L13.099 16.8391M13.099 16.8391L12.6979 16.9728C12.5074 17.0363 12.2973 16.9867 12.1553 16.8447C12.0133 16.7027 11.9637 16.4926 12.0272 16.3021L12.1609 15.901M13.099 16.8391L12.1609 15.901" stroke="#ffffff" stroke-width="1.5"></path> <path d="M8 13H10.5" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"></path> <path d="M8 9H14.5" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"></path> <path d="M8 17H9.5" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"></path> <path d="M19.8284 3.17157C18.6569 2 16.7712 2 13 2H11C7.22876 2 5.34315 2 4.17157 3.17157C3 4.34315 3 6.22876 3 10V14C3 17.7712 3 19.6569 4.17157 20.8284C5.34315 22 7.22876 22 11 22H13C16.7712 22 18.6569 22 19.8284 20.8284C20.7715 19.8853 20.9554 18.4796 20.9913 16" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"></path> </g></svg>',
            //html: '<svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" class="pswp__icn"><path d="M0,203.25c0,112.1,91.2,203.2,203.2,203.2c51.6,0,98.8-19.4,134.7-51.2l129.5,129.5c2.4,2.4,5.5,3.6,8.7,3.6 s6.3-1.2,8.7-3.6c4.8-4.8,4.8-12.5,0-17.3l-129.6-129.5c31.8-35.9,51.2-83,51.2-134.7c0-112.1-91.2-203.2-203.2-203.2 S0,91.15,0,203.25z M381.9,203.25c0,98.5-80.2,178.7-178.7,178.7s-178.7-80.2-178.7-178.7s80.2-178.7,178.7-178.7 S381.9,104.65,381.9,203.25z" /></svg>',
            //html: '<svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" class="pswp__icn">><path ></svg>',

            // Or provide full svg:
            // html: '<svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" class="pswp__icn"><path d="M20.5 14.3 17.1 18V10h-2.2v7.9l-3.4-3.6L10 16l6 6.1 6-6.1ZM23 23H9v2h14Z" /></svg>',

            // Or provide any other markup:
            // html: '<i class="fa-solid fa-download"></i>'
            onClick: (event, el, pswp) => {
                const currSlideElement = lightbox.pswp.currSlide.data.element;
                const tags = currSlideElement.querySelector('img').getAttribute('data-pswp-tags');
                const image_hash = currSlideElement.querySelector('img').getAttribute('data-pswp-hash');

                let json_tags;
                try {
                    json_tags = JSON.parse(tags)
                } catch (e) {
                    console.error(e)
                    json_tags = ["error_tags"]
                }

                let prompt_tags = prompt("(Separate by comma \"tag , tag\") - Please add your tag:", "" + json_tags.toString());
                if (prompt_tags == null || !prompt_tags) {
                    console.log("Adding tags cancelled");
                } else {
                    let data = {
                        image_hash,
                        tags: prompt_tags.trim().split(",")
                    }
                    axios.post('/tags/assign', data, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                        .then(function (response) {
                            // handle success
                            console.log(response);
                        })
                        .catch(function (error) {
                            // handle error
                            console.log(error.message);
                        })
                        .finally(function () {
                            // always executed
                        });
                }
            },
        });

    });

    lightbox.addFilter('numItems', (numItems) => {
        if (numItems === 0) {
            window.location.href = "/beta"
        }

        return ++numItems;
    });

    lightbox.on('contentActivate', ({content}) => {
        if (content.index === lightbox.getNumItems() - 1) {
            location.reload()
        }
    });

    lightbox.on('contentLoad', (e) => {
        const {content, isLazy} = e;

        if (content.data.webpSrc) {
            // prevent to stop the default behavior
            e.preventDefault();

            content.pictureElement = document.createElement('picture');

            const sourceWebp = document.createElement('source');
            sourceWebp.srcset = content.data.webpSrc;
            sourceWebp.type = 'image/webp';

            const sourceJpg = document.createElement('source');
            sourceJpg.srcset = content.data.src;
            sourceJpg.type = 'image/jpeg';

            content.element = document.createElement('img');
            content.element.src = content.data.src;
            content.element.setAttribute('alt', '');
            content.element.className = 'pswp__img';

            content.pictureElement.appendChild(sourceWebp);
            content.pictureElement.appendChild(sourceJpg);
            content.pictureElement.appendChild(content.element);

            content.state = 'loading';

            if (content.element.complete) {
                content.onLoaded();
            } else {
                content.element.onload = () => {
                    content.onLoaded();
                };

                content.element.onerror = () => {
                    content.onError();
                };
            }
        }
    })

    lightbox.addFilter('itemData', (itemData, index) => {
        return {
            ...itemData,
            src: itemData.src + "/download",
            msrc: itemData.msrc + "/download",
        };
    });
    lightbox.on('close', () => {
        location.reload()
    });


    lightbox.init();
    lightbox.loadAndOpen(0);
});