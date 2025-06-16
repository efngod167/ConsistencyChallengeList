import { store } from '../main.js';
import { fetchPacks, fetchPackLevels } from "../content.js";
import { getFontColour, embed } from "../util.js";
import { score } from "../score.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

export default {
    components: {
        Spinner,
        LevelAuthors,
    },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="pack-list">
            <div class="packs-nav">
                <div>
                    <button @click="switchLevels(i)" v-for="(pack, i) in packs" :style="{background: pack.colour}" class="type-label-lg">
                        <p :style="{color:getFontColour(pack.colour)}">{{pack.name}}</p>
                    </button>
                </div>
            </div>
            <div class="list-container">
                <table class="list" v-if="selectedPackLevels">
                    <tr v-for="(level, i) in selectedPackLevels">
                        <td class="rank">
                            <p class="type-label-lg">#{{ i + 1 }}</p>
                        </td>
                        <td class="level" :class="{ 'active': selectedLevel == i, 'error': !level[0] }">
                            <button :style= "[selectedLevel == i ? {background: pack.colour, color: getFontColour(pack.colour)} : {}]" @click="selectedLevel = i">
                                <span class="type-label-lg">{{ level[0]?.level.name || \`Error (\${level[1]}.json)\` }}</span>
                            </button>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="level-container">
                <div class="level" v-if="currentLevelData">
                    <h1>
                        <img :src="getDemonRating()" class="difficultyface" v-if="level?.rating"/>{{ level?.name }}
                    </h1>
                    <LevelAuthors :author="level?.author" :creators="level?.creators || []"  :creators0="level?.creators0" :verifier="level?.verifier"></LevelAuthors>
                    <div style="display:flex">
                        <div v-for="pack in level?.packs" :key="pack.name" class="tag" :style="{background:pack.colour, color:getFontColour(pack.colour)}">{{pack.name}}</div>
                    </div>
                    <div v-if="level?.showcase" class="tabs">
                        <button class="tab type-label-lg" :class="{selected: !toggledShowcase}" @click="toggledShowcase = false">
                            <span class="type-label-lg">Verification</span>
                        </button>
                        <button class="tab type-label-lg" :class="{selected: toggledShowcase}" @click="toggledShowcase = true">
                            <span class="type-label-lg">Showcase</span>
                        </button>
                    </div>
                    <iframe class="video" :src="video" frameborder="0"></iframe>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">ID</div>
                            <p>{{ level?.id }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">Password</div>
                            <p>{{ level?.password || 'Free to Copy' }}</p>
                        </li>
                    </ul>
                    <h2>Records</h2>
                    <table class="records" v-if="currentLevelData?.records?.length > 0">
                        <tr v-for="record in currentLevelData.records" :key="record.link" class="record">
                            <td class="link">
                                <a :href="record.link" target="_blank" class="type-label-lg">Video</a>
                            </td>
                            <td class="user">
                                <a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a>
                            </td>
                            <td class="mobile">
                                <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store?.dark ? '-dark' : ''}.svg\`" alt="Mobile">
                            </td>
                        </tr>
                    </table>
                </div>
                <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
                </div>
            </div>
            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                    <h3>About the packs</h3>
                    <p>
                        These are list packs all chosen by the staff team that you can beat levels for and get the packs attached to your profile.
                    </p>
                    <h3>How can I get these packs?</h3>
                    <p>
                        You get packs by beating all levels that are under them.
                    </p>
                    <p> Thanks to KrisGra for helping to make the packs functionality. </p>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        store,
        packs: [],
        errors: [],
        selected: 0,
        selectedLevel: 0,
        selectedPackLevels: [],
        loading: true,
        loadingPack: true,
        toggledShowcase: false,
    }),
    computed: {
        pack() {
            return this.packs[this.selected];
        },
        currentLevelData() {
            if (this.selectedPackLevels &&
                this.selectedPackLevels.length > this.selectedLevel &&
                this.selectedPackLevels[this.selectedLevel]) {
                // selectedPackLevels[selectedLevel] is a tuple [data, error]
                return this.selectedPackLevels[this.selectedLevel][0];
            }
            return null;
        },
        level() {
            // The actual level object with properties like name, author, verifier, etc.
            return this.currentLevelData?.level;
        },
        video() {
            if (!this.level) return ''; // Return empty string if no level data

			if (!this.level.showcase) {
				return embed(this.level.verification);
			}
			return embed(this.toggledShowcase ? this.level.showcase : this.level.verification);
		}
    },
    async mounted() {
        this.packs = await fetchPacks();

        if (!this.packs || this.packs.length === 0) {
            this.errors = [
                "Failed to load pack list. Retry in a few minutes or notify list staff.",
            ];
            this.loading = false;
            return;
        }

        this.selectedPackLevels = await fetchPackLevels(
            this.packs[this.selected].name
        );

        // Error handling
         // This specific check for !this.packs is now redundant due to the earlier check,
         // but the structure for populating errors from selectedPackLevels is good.
         if (!this.packs || this.packs.length === 0) { // Should ideally not be hit if caught above
             this.errors = [
                 "Failed to load list. Retry in a few minutes or notify list staff.",
             ];
         } else {
             this.errors.push(
                 ...this.selectedPackLevels
                     .filter(([_, err]) => err)
                     .map(([_, err]) => {
                         return `Failed to load level. (${err}.json)`;
                     })
             );
         }

        // Hide loading spinner
        this.loading = false;
        this.loadingPack = false;
    },
    methods: {
        async switchLevels(i) {
            this.loadingPack = true;

            this.selected = i;
            this.selectedLevel = 0;
            this.selectedPackLevels = await fetchPackLevels(
                this.packs[this.selected].name
            );
            // Error handling
            this.errors.length = 0;
            if (!this.packs) {
                this.errors = [
                    "Failed to load list. Retry in a few minutes or notify list staff.",
                ];
            } else {
                this.errors.push(
                    ...this.selectedPackLevels
                        .filter(([_, err]) => err)
                        .map(([_, err]) => {
                            return `Failed to load level. (${err}.json)`;
                        })
                );
            }
            this.loadingPack = false;
        },
        score,
        embed,
        getFontColour,
        getDemonRating(){
            const currentLevel = this.level; // Use the computed property

            // The v-if="level?.rating" in the template ensures this function is called
            // only when level and level.rating are truthy.
            // We still need to ensure level.difficulty is valid.
            if (!currentLevel || typeof currentLevel.difficulty !== 'number' || !currentLevel.rating) {
                 console.warn("getDemonRating: Conditions not met (level, difficulty, or rating missing/invalid).", currentLevel);
                 return '/assets/demonfaces/default.png'; // Fallback image
            }

            const difficultyNames = ["easy", "medium", "hard", "insane", "extreme"];
            if (currentLevel.difficulty < 0 || currentLevel.difficulty >= difficultyNames.length) {
                console.warn("getDemonRating: Invalid difficulty index.", currentLevel.difficulty);
                return '/assets/demonfaces/default.png';
            }
            const difficultyPrefix = difficultyNames[currentLevel.difficulty];

            // Assuming currentLevel.rating is a suffix string like "Demon".
            // It's guaranteed to be truthy here due to the template's v-if="level?.rating".
            const ratingSuffix = currentLevel.rating;

            const demonFaceFileName = difficultyPrefix + ratingSuffix;
            return `/assets/demonfaces/${demonFaceFileName}.png`;
        }
    },
};
