// Navigation Menu Toggle
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
                // Close mobile menu if open
                navLinks.classList.remove('active');
            }
        });
    });
});

// Contact Form Handling
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this);
        const formObject = {};
        formData.forEach((value, key) => {
            formObject[key] = value;
        });

        // Send email logic (placeholder)
        console.log('Sending email to synthia@mtacolis.com with data:', formObject);
        alert('Votre message a été envoyé à synthia@mtacolis.com !');
        
        // Show success message
        alert('Thank you for your message! We will get back to you soon.');
        this.reset();
    });
}

// Maps initialization and location selection
let boardingMap, deliveryMap;
let boardingMarker, deliveryMarker;

function initMaps() {
    const defaultLocation = [48.8566, 2.3522]; // Paris coordinates
    const mapOptions = {
        zoom: 13,
        center: defaultLocation,
        layers: [L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: ' OpenStreetMap contributors'
        })]
    };

    // Initialize boarding map
    boardingMap = L.map('boarding-map', mapOptions);
    
    // Initialize delivery map
    deliveryMap = L.map('delivery-map', mapOptions);

    // Add geocoder control to both maps
    setupMapControls('boarding');
    setupMapControls('delivery');
}

function setupMapControls(type) {
    const map = type === 'boarding' ? boardingMap : deliveryMap;
    
    // Add geocoder control
    const geocoder = L.Control.geocoder({
        defaultMarkGeocode: false
    }).addTo(map);

    // Handle geocoding results
    geocoder.on('markgeocode', function(e) {
        const latlng = e.geocode.center;
        setLocation(type, latlng, e.geocode.name);
    });

    // Click on map to set location
    map.on('click', function(e) {
        reverseGeocode(e.latlng, type);
    });
}

function setLocation(type, latlng, address = '') {
    const map = type === 'boarding' ? boardingMap : deliveryMap;
    const marker = type === 'boarding' ? boardingMarker : deliveryMarker;

    // Remove existing marker if any
    if (marker) {
        map.removeLayer(marker);
    }

    // Create new marker
    const newMarker = L.marker(latlng, {
        draggable: true
    }).addTo(map);

    // Handle marker drag
    newMarker.on('dragend', function() {
        const newLatLng = newMarker.getLatLng();
        reverseGeocode(newLatLng, type);
    });

    // Update marker reference
    if (type === 'boarding') {
        boardingMarker = newMarker;
    } else {
        deliveryMarker = newMarker;
    }

    // Center map on new location
    map.setView(latlng, map.getZoom());

    // Update hidden inputs
    document.getElementById(`${type}-lat`).value = latlng.lat;
    document.getElementById(`${type}-lng`).value = latlng.lng;

    // Update address if provided
    if (address) {
        document.getElementById(`${type}-address`).textContent = address;
    }

    // Calculate estimation if both locations are set
    if (boardingMarker && deliveryMarker) {
        calculateEstimation();
    }
}

function reverseGeocode(latlng, type) {
    const geocoder = L.Control.Geocoder.nominatim();
    geocoder.reverse(latlng, map.getZoom(), function(results) {
        if (results && results.length > 0) {
            setLocation(type, latlng, results[0].name);
        }
    });
}

function calculateEstimation() {
    if (!boardingMarker || !deliveryMarker) return;

    const weight = parseFloat(document.getElementById('weight').value) || 0;
    const mode = document.getElementById('delivery-mode').value;
    
    // Calculate distance
    const boardingLatLng = boardingMarker.getLatLng();
    const deliveryLatLng = deliveryMarker.getLatLng();
    const distance = boardingMap.distance(boardingLatLng, deliveryLatLng) / 1000; // Convert to kilometers

    // Base rates per km for different modes (example values)
    const rates = {
        plane: 2.5,
        truck: 1.2,
        boat: 0.8
    };

    // Weight multiplier (example: €0.5 per kg)
    const weightRate = 0.5;

    // Calculate total cost
    let cost = 0;
    if (mode && weight > 0) {
        cost = (distance * rates[mode]) + (weight * weightRate);
    }

    // Display results
    const costDisplay = document.getElementById('cost-display');
    const routeDetails = document.getElementById('route-details');
    
    costDisplay.textContent = `€${cost.toFixed(2)}`;
    routeDetails.innerHTML = `
        <p><strong>Distance:</strong> ${distance.toFixed(2)} km</p>
        <p><strong>Transport Mode:</strong> ${mode.charAt(0).toUpperCase() + mode.slice(1)}</p>
        <p><strong>Weight:</strong> ${weight} kg</p>
    `;
}

// Initialize maps when page loads
document.addEventListener('DOMContentLoaded', () => {
    initMaps();

    // Form submission handler
    document.getElementById('estimation-form').addEventListener('submit', (e) => {
        e.preventDefault();
        calculateEstimation();
    });

    // Recalculate when weight or mode changes
    document.getElementById('weight').addEventListener('input', calculateEstimation);
    document.getElementById('delivery-mode').addEventListener('change', calculateEstimation);
});

// Add scroll-based animations
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (sectionTop < windowHeight * 0.75) {
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }
    });
});

// Fetch countries and populate dropdowns
async function fetchCountries() {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all');
        const countries = await response.json();
        const countrySelects = document.querySelectorAll('.country-select');

        countries.sort((a, b) => a.name.common.localeCompare(b.name.common));

        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.cca2; // Use country code
            option.textContent = country.name.common;
            countrySelects.forEach(select => select.appendChild(option.cloneNode(true)));
        });

        // Add event listeners to load cities when a country is selected
        countrySelects.forEach(select => {
            select.addEventListener('change', (e) => {
                const citySelect = e.target.parentElement.nextElementSibling.querySelector('.city-select');
                
                if (e.target.value) {
                    citySelect.disabled = false; // Enable the city dropdown
                    fetchCitiesForCountry(e.target.value, citySelect);
                } else {
                    citySelect.disabled = true; // Disable if no country selected
                    citySelect.innerHTML = '<option value="">Select City</option>';
                }
            });
        });

        // Initialize city dropdowns as disabled
        document.querySelectorAll('.city-select').forEach(select => {
            select.disabled = true;
        });
    } catch (error) {
        console.error('Error fetching countries:', error);
    }
}

// Fetch cities for a country using the API
async function fetchCitiesForCountry(countryCode, citySelect) {
    try {
        // Clear previous options and show loading state
        citySelect.innerHTML = '<option value="">Loading cities...</option>';
        
        // Use the CountryStateCity API to fetch cities
        const response = await fetch(`https://countriesnow.space/api/v0.1/countries/cities`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                country: getCountryNameFromCode(countryCode)
            })
        });
        
        const data = await response.json();
        
        // Reset dropdown
        citySelect.innerHTML = '<option value="">Select City</option>';
        
        if (data.error) {
            console.error('API Error:', data.msg);
            // Fallback to a few default cities if API fails
            addFallbackCities(countryCode, citySelect);
            return;
        }
        
        // Sort cities alphabetically
        const cities = data.data.sort();
        
        // Add cities to dropdown
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error fetching cities:', error);
        // Fallback to a few default cities if API fails
        addFallbackCities(countryCode, citySelect);
    }
}

// Get full country name from country code
function getCountryNameFromCode(countryCode) {
    // Map of country codes to names for the API
    const countryMap = {
        'AF': 'Afghanistan',
        'AL': 'Albania',
        'DZ': 'Algeria',
        'AD': 'Andorra',
        'AO': 'Angola',
        'AR': 'Argentina',
        'AM': 'Armenia',
        'AU': 'Australia',
        'AT': 'Austria',
        'AZ': 'Azerbaijan',
        'BS': 'Bahamas',
        'BH': 'Bahrain',
        'BD': 'Bangladesh',
        'BB': 'Barbados',
        'BY': 'Belarus',
        'BE': 'Belgium',
        'BZ': 'Belize',
        'BJ': 'Benin',
        'BT': 'Bhutan',
        'BO': 'Bolivia',
        'BA': 'Bosnia and Herzegovina',
        'BW': 'Botswana',
        'BR': 'Brazil',
        'BN': 'Brunei',
        'BG': 'Bulgaria',
        'BF': 'Burkina Faso',
        'BI': 'Burundi',
        'KH': 'Cambodia',
        'CM': 'Cameroon',
        'CA': 'Canada',
        'CV': 'Cape Verde',
        'CF': 'Central African Republic',
        'TD': 'Chad',
        'CL': 'Chile',
        'CN': 'China',
        'CO': 'Colombia',
        'KM': 'Comoros',
        'CG': 'Congo',
        'CR': 'Costa Rica',
        'HR': 'Croatia',
        'CU': 'Cuba',
        'CY': 'Cyprus',
        'CZ': 'Czech Republic',
        'DK': 'Denmark',
        'DJ': 'Djibouti',
        'DM': 'Dominica',
        'DO': 'Dominican Republic',
        'EC': 'Ecuador',
        'EG': 'Egypt',
        'SV': 'El Salvador',
        'GQ': 'Equatorial Guinea',
        'ER': 'Eritrea',
        'EE': 'Estonia',
        'ET': 'Ethiopia',
        'FJ': 'Fiji',
        'FI': 'Finland',
        'FR': 'France',
        'GA': 'Gabon',
        'GM': 'Gambia',
        'GE': 'Georgia',
        'DE': 'Germany',
        'GH': 'Ghana',
        'GR': 'Greece',
        'GD': 'Grenada',
        'GT': 'Guatemala',
        'GN': 'Guinea',
        'GW': 'Guinea-Bissau',
        'GY': 'Guyana',
        'HT': 'Haiti',
        'HN': 'Honduras',
        'HU': 'Hungary',
        'IS': 'Iceland',
        'IN': 'India',
        'ID': 'Indonesia',
        'IR': 'Iran',
        'IQ': 'Iraq',
        'IE': 'Ireland',
        'IL': 'Israel',
        'IT': 'Italy',
        'JM': 'Jamaica',
        'JP': 'Japan',
        'JO': 'Jordan',
        'KZ': 'Kazakhstan',
        'KE': 'Kenya',
        'KI': 'Kiribati',
        'KP': 'North Korea',
        'KR': 'South Korea',
        'KW': 'Kuwait',
        'KG': 'Kyrgyzstan',
        'LA': 'Laos',
        'LV': 'Latvia',
        'LB': 'Lebanon',
        'LS': 'Lesotho',
        'LR': 'Liberia',
        'LY': 'Libya',
        'LI': 'Liechtenstein',
        'LT': 'Lithuania',
        'LU': 'Luxembourg',
        'MK': 'North Macedonia',
        'MG': 'Madagascar',
        'MW': 'Malawi',
        'MY': 'Malaysia',
        'MV': 'Maldives',
        'ML': 'Mali',
        'MT': 'Malta',
        'MH': 'Marshall Islands',
        'MR': 'Mauritania',
        'MU': 'Mauritius',
        'MX': 'Mexico',
        'FM': 'Micronesia',
        'MD': 'Moldova',
        'MC': 'Monaco',
        'MN': 'Mongolia',
        'ME': 'Montenegro',
        'MA': 'Morocco',
        'MZ': 'Mozambique',
        'MM': 'Myanmar',
        'NA': 'Namibia',
        'NR': 'Nauru',
        'NP': 'Nepal',
        'NL': 'Netherlands',
        'NZ': 'New Zealand',
        'NI': 'Nicaragua',
        'NE': 'Niger',
        'NG': 'Nigeria',
        'NO': 'Norway',
        'OM': 'Oman',
        'PK': 'Pakistan',
        'PW': 'Palau',
        'PA': 'Panama',
        'PG': 'Papua New Guinea',
        'PY': 'Paraguay',
        'PE': 'Peru',
        'PH': 'Philippines',
        'PL': 'Poland',
        'PT': 'Portugal',
        'QA': 'Qatar',
        'RO': 'Romania',
        'RU': 'Russia',
        'RW': 'Rwanda',
        'KN': 'Saint Kitts and Nevis',
        'LC': 'Saint Lucia',
        'VC': 'Saint Vincent and the Grenadines',
        'WS': 'Samoa',
        'SM': 'San Marino',
        'ST': 'Sao Tome and Principe',
        'SA': 'Saudi Arabia',
        'SN': 'Senegal',
        'RS': 'Serbia',
        'SC': 'Seychelles',
        'SL': 'Sierra Leone',
        'SG': 'Singapore',
        'SK': 'Slovakia',
        'SI': 'Slovenia',
        'SB': 'Solomon Islands',
        'SO': 'Somalia',
        'ZA': 'South Africa',
        'SS': 'South Sudan',
        'ES': 'Spain',
        'LK': 'Sri Lanka',
        'SD': 'Sudan',
        'SR': 'Suriname',
        'SZ': 'Eswatini',
        'SE': 'Sweden',
        'CH': 'Switzerland',
        'SY': 'Syria',
        'TW': 'Taiwan',
        'TJ': 'Tajikistan',
        'TZ': 'Tanzania',
        'TH': 'Thailand',
        'TL': 'Timor-Leste',
        'TG': 'Togo',
        'TO': 'Tonga',
        'TT': 'Trinidad and Tobago',
        'TN': 'Tunisia',
        'TR': 'Turkey',
        'TM': 'Turkmenistan',
        'TV': 'Tuvalu',
        'UG': 'Uganda',
        'UA': 'Ukraine',
        'AE': 'United Arab Emirates',
        'GB': 'United Kingdom',
        'US': 'United States',
        'UY': 'Uruguay',
        'UZ': 'Uzbekistan',
        'VU': 'Vanuatu',
        'VA': 'Vatican City',
        'VE': 'Venezuela',
        'VN': 'Vietnam',
        'YE': 'Yemen',
        'ZM': 'Zambia',
        'ZW': 'Zimbabwe'
    };
    
    // Return the country name from the map or fallback to the country code
    return countryMap[countryCode] || countryCode;
}

// Add fallback cities if API fails
function addFallbackCities(countryCode, citySelect) {
    // Clear previous options
    citySelect.innerHTML = '<option value="">Select City</option>';
    
    // Major cities by country (simplified version)
    const citiesByCountry = {
        // Africa
        'DZ': ['Algiers', 'Oran', 'Constantine'],
        'EG': ['Cairo', 'Alexandria', 'Giza'],
        'NG': ['Lagos', 'Kano', 'Ibadan'],
        'ZA': ['Johannesburg', 'Cape Town', 'Durban'],
        'KE': ['Nairobi', 'Mombasa', 'Kisumu'],
        'MA': ['Casablanca', 'Rabat', 'Marrakesh'],
        
        // Americas
        'US': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'],
        'CA': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa'],
        'MX': ['Mexico City', 'Guadalajara', 'Monterrey'],
        'BR': ['São Paulo', 'Rio de Janeiro', 'Brasília'],
        'AR': ['Buenos Aires', 'Córdoba', 'Rosario'],
        
        // Asia
        'CN': ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen'],
        'IN': ['Mumbai', 'Delhi', 'Bangalore', 'Kolkata', 'Chennai'],
        'JP': ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama'],
        'KR': ['Seoul', 'Busan', 'Incheon'],
        'ID': ['Jakarta', 'Surabaya', 'Bandung'],
        
        // Europe
        'GB': ['London', 'Manchester', 'Birmingham', 'Glasgow', 'Liverpool'],
        'FR': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice'],
        'DE': ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'],
        'IT': ['Rome', 'Milan', 'Naples', 'Turin', 'Florence'],
        'ES': ['Madrid', 'Barcelona', 'Valencia', 'Seville'],
        
        // Oceania
        'AU': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
        'NZ': ['Auckland', 'Wellington', 'Christchurch']
    };
    
    // Default cities for countries not in the list
    const defaultCities = ['Capital', 'Major City 1', 'Major City 2'];
    
    // Get cities for the selected country or use default
    const cities = citiesByCountry[countryCode] || defaultCities;
    
    // Add cities to dropdown
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
    });
}

// Initialize the country and city dropdowns
fetchCountries();

// Handle slideshow text animations synchronized with background images
document.addEventListener('DOMContentLoaded', function() {
    // Get all slide texts
    const slideshowTexts = document.querySelectorAll('.slide-text');
    const heroElement = document.querySelector('.hero');
    
    // Set the exact same duration as the CSS animation
    const totalDuration = 12000; // 12 seconds for the entire cycle (must match CSS)
    
    // Get the computed style to check when the animation started
    const heroStyle = window.getComputedStyle(heroElement);
    
    // Initialize the first slide as active
    slideshowTexts[0].classList.add('active');
    heroElement.style.backgroundImage = `url('../img/1.jpg')`;
    
    // Function to update the active slide text
    function updateSlideText() {
        // Get the animation progress from the computed style
        const animationName = heroStyle.animationName;
        const animationDuration = parseFloat(heroStyle.animationDuration) * 1000;
        const animationDelay = parseFloat(heroStyle.animationDelay) * 1000;
        
        // Calculate current time in the animation cycle
        const now = Date.now();
        const cycleTime = (now + animationDelay) % animationDuration;
        const cyclePosition = cycleTime / animationDuration;
        
        // Determine which slide should be active based on the animation progress
        let slideIndex;
        if (cyclePosition < 0.25) {
            slideIndex = 0; // First slide
        } else if (cyclePosition < 0.5) {
            slideIndex = 1; // Second slide
        } else if (cyclePosition < 0.75) {
            slideIndex = 2; // Third slide
        } else {
            slideIndex = 3; // Fourth slide
        }
        
        // Update classes and image
        slideshowTexts.forEach((text, index) => {
            if (index === slideIndex) {
                text.classList.add('active');
                heroElement.style.backgroundImage = `url('../img/${slideIndex + 1}.jpg')`;
            } else {
                text.classList.remove('active');
            }
        });
    }
    
    // Update immediately
    updateSlideText();
    
    // Update continuously with a higher frequency for better synchronization
    setInterval(updateSlideText, 50); // Check more frequently for better synchronization
});
