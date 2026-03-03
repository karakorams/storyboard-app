document.addEventListener('DOMContentLoaded', () => {
    // State
    let selectedStyle = null;
    let cutCounter = 1;

    // Elements
    const styleBtns = document.querySelectorAll('.style-btn');
    const mainGenerateBtn = document.getElementById('mainGenerateBtn');
    const addCutBtn = document.getElementById('addCutBtn');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    const saveSelectedBtn = document.getElementById('saveSelectedBtn');
    const cutsContainer = document.getElementById('cutsContainer');
    const cutTemplate = document.getElementById('cutTemplate');
    const toastContainer = document.getElementById('toastContainer');

    // Style Selection
    styleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            styleBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedStyle = btn.dataset.style;
        });
    });

    // Add new Cut
    addCutBtn.addEventListener('click', () => {
        cutCounter++;
        const newCut = cutTemplate.content.cloneNode(true);
        const cutItem = newCut.querySelector('.cut-item');
        cutItem.dataset.cutId = cutCounter;
        newCut.querySelector('.cut-number').textContent = cutCounter;

        // Add event listener for dynamic regenerate button
        const regenerateBtn = newCut.querySelector('.regenerate-btn');
        regenerateBtn.addEventListener('click', () => handleRegenerate(cutItem));

        // Setup clear button
        const clearBtn = newCut.querySelector('.clear-script-btn');
        clearBtn.addEventListener('click', () => {
            const cutEl = clearBtn.closest('.cut-item');
            cutEl.querySelectorAll('.script-input, .script-textarea').forEach(el => el.value = '');
        });

        // Copy script values from the previous cut if it exists
        const allCuts = document.querySelectorAll('.cut-item');
        if (allCuts.length > 0) {
            const lastCut = allCuts[allCuts.length - 1];
            newCut.querySelector('.script-bg').value = lastCut.querySelector('.script-bg').value;
            newCut.querySelector('.script-camera').value = lastCut.querySelector('.script-camera').value;
            newCut.querySelector('.script-mood').value = lastCut.querySelector('.script-mood').value;
            newCut.querySelector('.script-elements').value = lastCut.querySelector('.script-elements').value;
            newCut.querySelector('.script-detail').value = lastCut.querySelector('.script-detail').value;
        }

        cutsContainer.appendChild(newCut);

        // Scroll to bottom gracefully
        cutItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // Setup initial regenerate button handler (for CUT 1)
    const initialCut = document.querySelector('.cut-item');
    const initialRegenerateBtn = initialCut.querySelector('.regenerate-btn');
    initialRegenerateBtn.addEventListener('click', () => handleRegenerate(initialCut));

    // Setup initial clear script button handler (for CUT 1)
    const initialClearBtn = initialCut.querySelector('.clear-script-btn');
    initialClearBtn.addEventListener('click', () => {
        initialCut.querySelectorAll('.script-input, .script-textarea').forEach(el => el.value = '');
    });

    // Delete Selected Cuts
    deleteSelectedBtn.addEventListener('click', () => {
        const cuts = Array.from(document.querySelectorAll('.cut-item'));
        const cutsToDelete = cuts.filter(cut => cut.querySelector('.cut-checkbox').checked);

        if (cutsToDelete.length === 0) {
            showToast('삭제할 컷을 선택해주세요.');
            return;
        }

        if (confirm(`선택한 ${cutsToDelete.length}개의 컷을 삭제하시겠습니까?`)) {
            cutsToDelete.forEach(cut => cut.remove());

            // If all cuts are deleted, automatically add an empty cut as a fallback
            if (document.querySelectorAll('.cut-item').length === 0) {
                addCutBtn.click();
            } else {
                updateCutNumbers(); // Update sequence numbering for existing cuts
            }
        }
    });

    // Helper to re-sequence cut numbers
    function updateCutNumbers() {
        const remainingCuts = document.querySelectorAll('.cut-item');
        remainingCuts.forEach((cut, index) => {
            const newNum = index + 1;
            cut.dataset.cutId = newNum;
            const numberSpan = cut.querySelector('.cut-number');
            if (numberSpan) {
                numberSpan.textContent = newNum;
            }
        });
        // Sync the global counter
        cutCounter = remainingCuts.length;
    }

    // Save Selected Cuts
    saveSelectedBtn.addEventListener('click', () => {
        const cuts = Array.from(document.querySelectorAll('.cut-item'));
        const cutsToSave = cuts.filter(cut => cut.querySelector('.cut-checkbox').checked);

        if (cutsToSave.length === 0) {
            showToast('저장할 컷을 선택해주세요.');
            return;
        }

        const validCuts = cutsToSave.filter(cut => {
            const img = cut.querySelector('.generated-image');
            return img.style.display !== 'none' && img.src;
        });

        if (validCuts.length === 0) {
            showToast('선택한 컷 중 이미지가 생성된 컷이 없습니다.');
            return;
        }

        validCuts.forEach(cut => {
            const imgEl = cut.querySelector('.generated-image');
            const cutNum = cut.querySelector('.cut-number')?.textContent || cut.dataset.cutId;
            const a = document.createElement('a');
            a.href = imgEl.src;
            a.download = `storyboard_cut_${cutNum}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });

        showToast(`${validCuts.length}개의 파일 다운로드가 시작되었습니다.`, 'success');
    });

    // Toast Notification
    function showToast(message, type = 'error') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 3000); // Remove after 3 seconds
    }

    // Generate Button Logic
    mainGenerateBtn.addEventListener('click', () => {
        const apiKey = document.getElementById('geminiApiKey').value.trim();
        if (!apiKey) {
            showToast('우측 상단에 Gemini API 키를 입력해주세요.');
            return;
        }

        if (!selectedStyle) {
            showToast('스타일을 먼저 선택해주세요.');
            return;
        }

        const cuts = Array.from(document.querySelectorAll('.cut-item'));
        const cutsToGenerate = cuts.filter(cut => {
            const checkbox = cut.querySelector('.cut-checkbox');
            const hasGeneratedImage = cut.querySelector('.generated-image').style.display !== 'none';
            // Only generate if checked AND not already generated.
            return checkbox.checked && !hasGeneratedImage;
        });

        if (cutsToGenerate.length === 0) {
            const checkedCuts = cuts.filter(c => c.querySelector('.cut-checkbox').checked);
            if (checkedCuts.length === 0) {
                showToast('생성할 컷을 하나 이상 선택해주세요.');
            } else {
                showToast('선택한 컷은 이미 생성되었습니다. 다시 생성하려면 컷 이미지의 [다시 생성] 버튼을 이용해주세요.');
            }
            return;
        }

        cutsToGenerate.forEach(cut => {
            generateCut(cut, selectedStyle);
        });
    });

    async function handleRegenerate(cutElement) {
        const apiKey = document.getElementById('geminiApiKey').value.trim();
        if (!apiKey) {
            showToast('우측 상단에 Gemini API 키를 입력해주세요.');
            return;
        }

        if (!selectedStyle) {
            showToast('스타일을 먼저 선택해주세요.');
            return;
        }
        generateCut(cutElement, selectedStyle);
    }

    async function generateCut(cutElement, style) {
        const bg = cutElement.querySelector('.script-bg').value.trim();
        const cam = cutElement.querySelector('.script-camera').value.trim();
        const mood = cutElement.querySelector('.script-mood').value.trim();
        const elements = cutElement.querySelector('.script-elements').value.trim();
        const detail = cutElement.querySelector('.script-detail').value.trim();

        const combinedScriptParts = [];
        if (bg) combinedScriptParts.push(`[Background/Setting] ${bg}`);
        if (cam) combinedScriptParts.push(`[Camera Angle] ${cam}`);
        if (mood) combinedScriptParts.push(`[Atmosphere/Mood] ${mood}`);
        if (elements) combinedScriptParts.push(`[Key Elements] ${elements}`);
        if (detail) combinedScriptParts.push(`[Detailed Situation] ${detail}`);

        const scriptText = combinedScriptParts.join(', ');

        const placeholder = cutElement.querySelector('.image-placeholder');
        const imgEl = cutElement.querySelector('.generated-image');
        const regenBtn = cutElement.querySelector('.regenerate-btn');
        const loader = placeholder.querySelector('.loader');
        const placeholderText = placeholder.querySelector('.placeholder-text');

        if (!scriptText) {
            showToast(`CUT ${cutElement.dataset.cutId}의 스크립트를 하나 이상 작성해주세요.`);
            return;
        }

        // UI Loading State
        placeholderText.style.display = 'none';
        loader.style.display = 'block';
        imgEl.style.display = 'none';
        regenBtn.style.display = 'none';

        try {
            const resultUrl = await callGeminiAPI(scriptText, style);

            // Set image and reveal
            imgEl.src = resultUrl;
            imgEl.style.display = 'block';
            regenBtn.style.display = 'block'; // Ensure regenerate button is active
        } catch (error) {
            showToast(`CUT ${cutElement.dataset.cutId} 생성 실패: ${error.message}`);
            placeholderText.style.display = 'block';
            imgEl.style.display = 'none';
        } finally {
            loader.style.display = 'none';
        }
    }

    async function callGeminiAPI(prompt, style) {
        const apiKey = document.getElementById('geminiApiKey').value.trim();

        if (!apiKey) {
            throw new Error("API 키가 없습니다.");
        }

        // Gemini Imagen 4 Generation API
        const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict`;

        const stylePrefix = style === 'linedrawing'
            ? "A high-quality webtoon style illustration in grayscale. Clean black line art with soft monochrome shading. Slice-of-life atmosphere. The characters have expressive features and a modern Korean manhwa aesthetic. No vibrant colors, only black, white, and varying tones of gray. "
            : "never vertical, never square, semi-realistic emotional editorial illustration style, realistic human facial structure and proportions, based on real-life facial features rather than webtoon or cartoon styling, soft refined digital painting, delicate and polished rendering, thin clean dark-brown linework instead of black outlines, subtle contour lines, warm muted sepia-beige palette, creamy ivory highlights, soft sand beige, warm gray, dusty brown midtones, low saturation, gentle natural skin shading, soft and believable facial modeling, calm realistic eyes, nose, and lips with no exaggeration, elegant restrained expressions, natural hair rendered in smooth masses rather than sharp strands, softly organized realistic background treatment, clean and uncluttered spatial detail, warm diffused indoor light or gentle natural light, subtle bloom in bright areas, airy atmosphere, tender and calm lifestyle-drama mood, premium hospital brochure or emotional advertisement illustration tone, realistic but softened visual finish, cinematic still-frame feeling, polished and understated image quality, no comic feeling, no manga feeling, no webtoon style, no cel shading, no chibi proportions, no exaggerated anime eyes, no thick black outlines, no saturated colors, no neon tones, no slapstick expressions, no harsh contrast, no gritty texture, no glossy 3D render look, no photoreal skin pores, no hard rim light, no overly dramatic shadows. ";

        const fullPrompt = stylePrefix + prompt;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey
                },
                body: JSON.stringify({
                    instances: [
                        { prompt: fullPrompt }
                    ],
                    parameters: {
                        sampleCount: 1,
                        aspectRatio: "4:3"
                    }
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error?.message || 'API request failed');
            }

            const data = await response.json();

            if (data && data.predictions && data.predictions.length > 0) {
                const base64Image = data.predictions[0].bytesBase64Encoded;
                return `data:image/jpeg;base64,${base64Image}`;
            } else {
                throw new Error("No image data returned from API.");
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
});
