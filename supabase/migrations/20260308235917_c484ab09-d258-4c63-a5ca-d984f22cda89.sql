-- Create lesson_topic enum
CREATE TYPE public.lesson_topic AS ENUM ('climate_change', 'pollution', 'waste', 'energy', 'water', 'biodiversity');

-- Create lessons table
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic lesson_topic NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  summary TEXT NOT NULL,
  fact_boxes JSONB NOT NULL DEFAULT '[]'::jsonb,
  key_takeaways TEXT[] NOT NULL DEFAULT '{}'::text[],
  eco_points_reward INTEGER NOT NULL DEFAULT 20,
  estimated_minutes INTEGER NOT NULL DEFAULT 5,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on lessons (public read)
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view lessons" ON public.lessons FOR SELECT USING (true);

-- Create lesson_completions table
CREATE TABLE public.lesson_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Enable RLS on lesson_completions
ALTER TABLE public.lesson_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own completions" ON public.lesson_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own completions" ON public.lesson_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create quiz_attempts table
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  topic lesson_topic NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL DEFAULT 7,
  points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on quiz_attempts
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own quiz attempts" ON public.quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quiz attempts" ON public.quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert seed data for all 7 lessons
INSERT INTO public.lessons (topic, title, body, summary, fact_boxes, key_takeaways, eco_points_reward, estimated_minutes, order_index) VALUES
(
  'climate_change',
  'What is Climate Change?',
  E'Climate change refers to long-term shifts in global temperatures and weather patterns. While climate variations can occur naturally, scientific evidence overwhelmingly shows that human activities have been the primary driver of climate change since the 1800s.\n\n**The Greenhouse Effect**\n\nThe Earth''s atmosphere contains gases like carbon dioxide (CO₂), methane, and nitrous oxide that trap heat from the sun — much like glass panels in a greenhouse. This natural phenomenon keeps our planet warm enough to sustain life. However, human activities have dramatically increased the concentration of these greenhouse gases.\n\n**Human Causes**\n\nThe burning of fossil fuels — coal, oil, and natural gas — for energy is the largest source of greenhouse gas emissions. Power plants, vehicles, and industrial processes release billions of tonnes of CO₂ annually. Deforestation compounds the problem by removing trees that absorb CO₂. Agriculture, particularly livestock farming, produces significant methane emissions.\n\n**Current Impacts**\n\nThe consequences of climate change are already visible worldwide. Global average temperatures have risen by approximately 1.1°C since pre-industrial times. Polar ice caps are melting at unprecedented rates, causing sea levels to rise. Extreme weather events — hurricanes, droughts, floods, and heatwaves — are becoming more frequent and intense.\n\n**Why Action Matters**\n\nEvery fraction of a degree of warming matters. Scientists warn that limiting warming to 1.5°C above pre-industrial levels is crucial to avoid the most catastrophic impacts. This requires rapid, far-reaching changes in how we produce energy, grow food, and design our cities. The choices we make today will determine the world future generations inherit.',
  'Climate change is the long-term shift in global temperatures caused primarily by human activities like burning fossil fuels.',
  '[{"text": "Earth has warmed by 1.1°C since pre-industrial times — the fastest warming in 2,000 years."}, {"text": "The last decade (2011-2020) was the hottest on record in human history."}]'::jsonb,
  ARRAY['Climate change is driven by greenhouse gas emissions from human activities', 'Burning fossil fuels is the primary source of CO₂ emissions', 'Effects include rising temperatures, melting ice, and extreme weather', 'Limiting warming to 1.5°C requires immediate global action'],
  20, 5, 1
),
(
  'climate_change',
  'Climate Solutions',
  E'Addressing climate change requires transforming how we produce and consume energy, while protecting and restoring natural ecosystems. Solutions exist at every scale — from international agreements to individual choices.\n\n**Renewable Energy Transition**\n\nThe shift from fossil fuels to renewable energy is already underway. Solar photovoltaic technology has become the cheapest source of electricity in history, with costs dropping 89% since 2010. Wind power provides clean electricity in over 90 countries. Hydroelectric, geothermal, and advanced nuclear technologies offer additional carbon-free options.\n\n**Energy Efficiency**\n\nThe cleanest energy is the energy we don''t use. Modern LED lighting uses 75% less electricity than traditional bulbs. Electric vehicles convert 85-90% of energy to motion versus 20-30% for petrol cars. Smart building design, improved insulation, and efficient appliances can dramatically reduce energy consumption.\n\n**Nature-Based Solutions**\n\nForests, wetlands, and oceans are powerful carbon sinks. Reforestation and afforestation can absorb significant CO₂ while providing habitat for wildlife. Protecting existing forests, particularly tropical rainforests, prevents stored carbon from being released. Regenerative agriculture practices build soil carbon while improving farm productivity.\n\n**Individual vs Systemic Change**\n\nWhile individual actions matter, systemic change is essential. Supporting policies that price carbon, phase out fossil fuel subsidies, and invest in clean infrastructure creates lasting impact. Your voice as a citizen and consumer influences corporate and government decisions. Collective action multiplies individual efforts.\n\n**The Path Forward**\n\nThe solutions to climate change are available today. What''s needed is the collective will to implement them at speed and scale. Every action counts — from the energy you use to the leaders you support.',
  'Climate solutions include renewable energy, efficiency improvements, and protecting natural carbon sinks.',
  '[{"text": "Solar energy is now the cheapest electricity source in history — costs dropped 89% since 2010."}, {"text": "One tree absorbs approximately 21 kg of CO₂ per year throughout its lifetime."}]'::jsonb,
  ARRAY['Renewable energy like solar and wind is now cost-competitive', 'Energy efficiency reduces emissions without sacrificing quality of life', 'Forests and oceans are natural carbon sinks worth protecting', 'Both individual actions and systemic policy changes are needed'],
  20, 5, 2
),
(
  'pollution',
  'Understanding Pollution',
  E'Pollution occurs when harmful substances contaminate our environment, affecting air, water, soil, and living organisms. Understanding the types and sources of pollution is the first step toward addressing this global challenge.\n\n**Types of Pollution**\n\nAir pollution includes particulate matter, ground-level ozone, nitrogen dioxide, and sulphur dioxide from vehicles, factories, and power plants. Water pollution stems from industrial discharge, agricultural runoff, sewage, and plastic waste contaminating rivers, lakes, and oceans. Soil pollution results from pesticides, heavy metals, and improper waste disposal. Noise pollution from traffic and industry affects both human health and wildlife. Light pollution disrupts ecosystems and obscures the night sky.\n\n**Health Impacts**\n\nPollution poses severe risks to human health. Air pollution alone causes an estimated 7 million premature deaths annually worldwide, contributing to respiratory diseases, heart disease, and cancer. Contaminated water spreads diseases like cholera and typhoid. Soil pollution affects food safety and can cause long-term health issues.\n\n**Environmental Damage**\n\nEcosystems suffer tremendously from pollution. Acid rain damages forests and aquatic habitats. Ocean acidification threatens marine life, particularly shellfish and coral reefs. The Great Pacific Garbage Patch — a floating mass of plastic debris — spans an area twice the size of Texas.\n\n**The Microplastics Crisis**\n\nMicroplastics — tiny plastic fragments less than 5mm — have infiltrated every corner of the planet. They''ve been found in Arctic ice, deep ocean trenches, and even human blood. These particles enter the food chain, with unknown long-term consequences for health.\n\n**Solutions Within Reach**\n\nReducing pollution requires cleaner technologies, stronger regulations, and changed behaviours. Electric vehicles, renewable energy, proper waste management, and sustainable agriculture all contribute to cleaner environments.',
  'Pollution contaminates air, water, and soil through harmful substances from human activities.',
  '[{"text": "8 million tonnes of plastic enter the ocean every year — equivalent to dumping a garbage truck every minute."}, {"text": "Air pollution causes 7 million premature deaths annually — more than HIV, malaria, and tuberculosis combined."}]'::jsonb,
  ARRAY['Pollution types include air, water, soil, noise, and light pollution', 'Air pollution causes 7 million deaths annually worldwide', 'Microplastics have infiltrated every ecosystem on Earth', 'Solutions include cleaner technology and stronger regulations'],
  20, 5, 1
),
(
  'waste',
  'Waste Reduction Strategies',
  E'Effective waste management follows a hierarchy of actions — from preventing waste in the first place to responsible disposal. Understanding and applying this hierarchy can dramatically reduce our environmental footprint.\n\n**The Waste Hierarchy**\n\nThe most effective strategy is to Refuse — declining unnecessary items like single-use plastics. Next is Reduce — buying less and choosing products with minimal packaging. Reuse extends product life through repair, donation, or repurposing. Recycle transforms waste materials into new products. Finally, Recover captures energy from waste that cannot be recycled.\n\n**Composting: Nature''s Recycling**\n\nOrganic waste — food scraps, garden trimmings, paper — makes up roughly 30-40% of household waste. When sent to landfills, it decomposes without oxygen, producing methane, a potent greenhouse gas. Composting instead creates nutrient-rich soil while reducing methane emissions by up to 50%.\n\n**The Circular Economy**\n\nThe traditional ''take-make-dispose'' economic model is unsustainable. A circular economy keeps materials in use through repair, refurbishment, remanufacturing, and recycling. Products are designed for durability and eventual disassembly. Waste becomes a resource for new production.\n\n**Sorting Waste Correctly**\n\nProper sorting maximises recycling effectiveness. Clean, dry recyclables have higher value. Contamination — food residue, mixed materials — can render entire batches unrecyclable. In India, segregating wet (organic), dry (recyclable), and hazardous waste at source is increasingly required by law.\n\n**E-Waste: A Growing Concern**\n\nElectronic waste is the fastest-growing waste stream globally. Phones, computers, and appliances contain valuable materials but also toxic substances. Proper e-waste recycling recovers resources while preventing environmental contamination.\n\n**Taking Action**\n\nStart with a waste audit — understanding what you throw away reveals opportunities for reduction. Small changes accumulate: carrying reusable bags, refusing straws, choosing products with recyclable packaging.',
  'The waste hierarchy prioritises refusing, reducing, reusing, and recycling over disposal.',
  '[{"text": "Only 9% of all plastic ever produced has been recycled — the rest is in landfills, incinerators, or the environment."}, {"text": "Composting reduces landfill methane emissions by up to 50% while creating valuable soil."}]'::jsonb,
  ARRAY['Follow the waste hierarchy: Refuse, Reduce, Reuse, Recycle, Recover', 'Composting organic waste prevents methane emissions', 'The circular economy keeps materials in use longer', 'Proper sorting ensures recyclables actually get recycled'],
  20, 5, 1
),
(
  'energy',
  'Renewable Energy Sources',
  E'Renewable energy harnesses natural processes that continuously replenish — sunlight, wind, water, and heat from the Earth. These clean alternatives to fossil fuels are transforming how we power our world.\n\n**Solar Power**\n\nSolar photovoltaic (PV) panels convert sunlight directly into electricity using semiconductor materials. Costs have plummeted, making solar the cheapest electricity source in many regions. Rooftop solar empowers homes and businesses to generate their own power. Large solar farms can power entire cities.\n\n**Wind Energy**\n\nWind turbines capture kinetic energy from moving air. Modern turbines reach over 200 metres tall, with blades spanning 150 metres. Offshore wind farms take advantage of stronger, more consistent ocean winds. Wind is now the fastest-growing energy source globally.\n\n**Hydroelectric Power**\n\nHydropower generates electricity from flowing water. Large dams store water and release it through turbines. Run-of-river systems use natural water flow without major reservoirs. Hydropower currently provides about 16% of global electricity.\n\n**Geothermal Energy**\n\nGeothermal power taps heat from Earth''s interior. In volcanic regions, steam from underground reservoirs drives turbines. Heat pumps can extract geothermal energy almost anywhere for heating and cooling buildings.\n\n**Biomass**\n\nBiomass energy comes from organic materials — wood, agricultural waste, dedicated energy crops. When sustainably managed, biomass can be carbon-neutral, as growing plants absorb CO₂ equal to what''s released when burned.\n\n**India''s Renewable Revolution**\n\nIndia has emerged as a renewable energy leader, now the 4th largest producer of solar power globally. The government targets 500 GW of renewable capacity by 2030. States like Gujarat, Rajasthan, and Tamil Nadu are pioneering large-scale solar and wind installations.\n\n**What Students Can Do**\n\nAdvocate for renewable energy in your school and community. Simple actions include switching off unnecessary lights, using natural lighting, and supporting clean energy policies.',
  'Renewable energy sources like solar, wind, and hydro provide clean alternatives to fossil fuels.',
  '[{"text": "India is the 4th largest solar power producer in the world, with capacity growing rapidly."}, {"text": "Wind energy is the fastest-growing energy source globally, with costs dropping 70% since 2010."}]'::jsonb,
  ARRAY['Solar PV is now the cheapest electricity source in many regions', 'Wind power is the fastest-growing energy source worldwide', 'India aims for 500 GW of renewable capacity by 2030', 'Energy conservation multiplies the impact of renewables'],
  20, 5, 1
),
(
  'water',
  'Water Conservation',
  E'Water is essential for all life, yet freshwater is increasingly scarce. Understanding water systems and conservation techniques helps us protect this precious resource for future generations.\n\n**Global Water Scarcity**\n\nWhile 71% of Earth is covered by water, only 3% is freshwater, and most of that is locked in ice caps and glaciers. Less than 1% of all water is readily available for human use. Over 2 billion people live in water-stressed regions, a number projected to grow with climate change.\n\n**The Water Cycle**\n\nWater continuously moves through evaporation, condensation, precipitation, and collection. Human activities disrupt this cycle through pollution, deforestation, and excessive extraction from rivers and aquifers. Many groundwater sources are being depleted faster than they can naturally recharge.\n\n**Conservation Techniques**\n\nDrip irrigation delivers water directly to plant roots, reducing agricultural water use by up to 60% compared to flood irrigation. Rainwater harvesting captures precipitation for later use. Fixing leaky taps and pipes prevents significant waste — a dripping tap can waste 20,000 litres per year.\n\n**India''s Water Crisis**\n\nIndia faces severe water stress. Groundwater levels are falling in many regions due to over-extraction for agriculture. Major rivers like the Ganga and Yamuna suffer from pollution. Chennai, Bangalore, and other cities have experienced acute water shortages.\n\n**Traditional Wisdom**\n\nIndia has rich traditions of water management. Step wells (baolis), tanks (talabs), and check dams preserved water for centuries. Reviving these traditional systems alongside modern technology offers sustainable solutions.\n\n**Individual Actions**\n\nShorten showers, turn off taps while brushing, fix leaks promptly, and use water-efficient appliances. Collect rainwater for gardens. Choose foods with lower water footprints — producing 1 kg of rice requires 2,500 litres of water, while vegetables need far less.\n\n**Protecting Water Sources**\n\nClean water depends on healthy ecosystems. Wetlands filter pollutants naturally. Forests protect watersheds. Supporting conservation efforts safeguards water supplies for everyone.',
  'Water conservation protects our limited freshwater through efficient use and ecosystem protection.',
  '[{"text": "Only 3% of Earth''s water is freshwater, and less than 1% is readily available for human use."}, {"text": "A dripping tap wastes up to 20,000 litres of water per year — enough to fill 100 bathtubs."}]'::jsonb,
  ARRAY['Less than 1% of all water is available for human use', 'Drip irrigation can reduce water use by up to 60%', 'India faces severe water stress in many regions', 'Traditional water management systems offer sustainable solutions'],
  20, 5, 1
),
(
  'biodiversity',
  'Why Biodiversity Matters',
  E'Biodiversity — the variety of life on Earth — encompasses all living organisms, from bacteria to blue whales, and the ecosystems they form. This web of life sustains everything humans depend upon.\n\n**What is Biodiversity?**\n\nBiodiversity exists at three levels: genetic diversity within species, species diversity within ecosystems, and ecosystem diversity across landscapes. Each level supports the others. Genetic diversity helps species adapt to change. Species diversity creates resilient ecosystems. Ecosystem diversity provides varied habitats and resources.\n\n**Ecosystem Services**\n\nNature provides services essential for human survival. Pollination by insects and birds enables 75% of crop species to reproduce. Forests regulate climate, purify air, and prevent soil erosion. Wetlands filter water and buffer against floods. Coral reefs protect coastlines and support fisheries. The economic value of these services runs into trillions of dollars annually.\n\n**The Food Web**\n\nAll life is interconnected through food webs. Plants capture solar energy through photosynthesis. Herbivores eat plants; carnivores eat herbivores. Decomposers recycle nutrients back to soil. Remove one species, and ripple effects spread through the web. Keystone species, like tigers or bees, have disproportionate influence on their ecosystems.\n\n**The Sixth Mass Extinction**\n\nEarth is experiencing its sixth mass extinction event — this time caused by humans. Species are disappearing at 100 to 1,000 times the natural rate. An estimated 1 million species face extinction within decades. Habitat loss, overexploitation, pollution, invasive species, and climate change drive this crisis.\n\n**What Students Can Do**\n\nCreate wildlife-friendly spaces — even small gardens or balconies can support pollinators. Avoid products that harm biodiversity. Support conservation organisations. Learn about local species and ecosystems. Spread awareness about the importance of protecting nature.\n\n**Hope Through Action**\n\nConservation successes prove recovery is possible. Tigers in India have increased from 1,411 in 2006 to over 3,000 today. Protected areas, wildlife corridors, and community involvement make the difference.',
  'Biodiversity — the variety of life — provides essential ecosystem services that sustain human civilization.',
  '[{"text": "1 million species face extinction — the largest loss since the dinosaurs disappeared 66 million years ago."}, {"text": "Bees and other pollinators are responsible for one-third of all food humans eat."}]'::jsonb,
  ARRAY['Biodiversity provides essential ecosystem services worth trillions annually', 'We are in the midst of the sixth mass extinction', 'Habitat loss is the primary driver of species decline', 'Conservation efforts can reverse declines — tiger populations have doubled in India'],
  20, 5, 1
);