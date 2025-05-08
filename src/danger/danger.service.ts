import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { GetLocationDto } from './dto/get-location.dto';
import { ChangeModeDto } from './dto/change-mode.dto';
import axios from 'axios';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DangerService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly systemPrompt = `
  (Respond with output only; do not include any explanations or echo the prompt.)

Please provide a location safety assessment along with personalized information.

# Assessment Method
Using the following 5-level safety rating system, evaluate the location and provide safety information tailored to the user’s characteristics:

## Safety Rating Criteria (Relaxed Standards)
- Level 1 (Very Safe) – fewer than 30 crimes per 100,000 people per year; security facilities within a 3 km radius; good nighttime lighting  
- Level 2 (Safe) – 30–70 crimes per 100,000 people per year; good access to security facilities; mixed commercial/residential area  
- Level 3 (Normal) – 70–120 crimes per 100,000 people per year; security facilities present; some areas requiring caution  
- Level 4 (Caution) – 120–200 crimes per 100,000 people per year; limited access to security facilities; nighttime caution advised  
- Level 5 (Danger) – over 200 crimes per 100,000 people per year; lack of security facilities; nighttime movement is risky  

## General Baseline Safety Levels by Area Type (for reference before analysis)
- University districts (e.g., Anam-dong, Sinchon): baseline Level 2 (Safe)  
- Major tourist areas (e.g., Insadong, Myeongdong): baseline Level 2 (Safe)  
- Commercial districts (e.g., Gangnam, Apgujeong): baseline Level 2 (Safe)  
- Residential neighborhoods: baseline Level 2–3 (varies by area)  
- Nightlife/night entertainment districts: baseline Level 3 (Normal); for female users, Level 4 (Caution)  
- Industrial areas: baseline Level 3 (Normal)  

## Analysis Steps
- Retrieve crime statistics for the past year (news, police reports, official data)  
- Check locations and density of security facilities (police stations, substations)  
- Evaluate nighttime safety factors (lighting, population density, commercial activity)  
- Assess public transportation access and operating hours  
- Review local resident and traveler reviews  

# Output Requirements

## 1. Push-notification Summary (≤160 characters, one line)  
[One-sentence summary of safety status and advice in the user’s language; do **not** mention the numeric safety level or descriptor]

## 2. Detailed Safety Information (each section 1–3 sentences, total ≤1100 characters)  
*(Do **not** include the summary here.)*  

Density of Security Facilities  
[Specific information about facility density]

Recent Theft Reports  
[Up-to-date information on theft reports]

Personal Safety Considerations  
[Safety advice tailored to user characteristics—if female, emphasize women’s safety at night]

Nearby Google Map Reviews  
[Summarized key points from Google Maps reviews within 1 km]

# Important Guidelines
- Keep the push-notification summary under 160 characters.  
- State safety levels definitively (avoid “may” or “seems”).  
- Cross-verify information from multiple sources (official stats, news, reviews).  
- Only include hyper-localized details; avoid generic travel warnings.  
- Personalize advice without repeating user info verbatim.  
- Never say “reviews not found”; instead, synthesize nearby reviews.  
- In “Personal Safety Considerations”:
  * For female users: prioritize nighttime safety, risks of gender-based crime, safe-ride services  
  * For elderly users: focus on accessibility and mobility safety  
  * For users with disabilities: provide relevant accessibility and safety tips  
  * For foreign visitors: address language barriers and cultural safety  
- Structure detailed info by category and remain concise.  
- Do not include any formatting instructions in the output.

# JSON Output Specification
Output a single JSON object with exactly these fields:
{{
  "location": "<address translated literally into the user’s language without any parentheses or additional place names>",
  "safetyLevel": <integer 1–5>,
  "summary": "<one-sentence summary without safety level>",
  "detail": [
    {{"title": "<‘Density of Security Facilities’ translated>",
      "content": "<1–3 sentences>"}},
    {{"title": "<‘Recent Theft Reports’ translated>",
      "content": "<1–3 sentences>"}},
    {{"title": "<‘Personal Safety Considerations’ translated>",
      "content": "<1–3 sentences>"}},
    {{"title": "<‘Nearby Google Map Reviews’ translated>",
      "content": "<1–3 sentences>"}}
  ]
}}
  `

  private readonly userPromptTemplate = `
  Analyze the following address:
{address}

## User Information
nationality: {nationality}
birth_year: {birth_year}
sex: {sex}
language: {language}
difficulties: {difficulties}
  `
  
    //위도, 경도 -> 주소(영어)로 변환하는 함수
    async getAddressFromCoordinates(latitude: number, longitude: number): Promise<string> {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;

        const response = await axios.get(url);  //axios 사용하여 url에 get 요청 보내고 응답 받음
        const results = response.data.results;  //응답에서 결과 추출
        //console.log('Result:', JSON.stringify(results, null, 2));

        if (results.length === 0) {
            throw new NotFoundException('No results found');
        }

        //console.log('First result:', JSON.stringify(results[0], null, 2));
        const addressComponents = results[0].formatted_address;
        console.log('Final address:', addressComponents);
        return addressComponents; //영어로 반환된다. 언어가 한국어인 경우엔 이것도 한국어로 바꿔야 함.
    }

    //위도, 경도 -> 주소(한글)로 변환하는 함수
    async getKoreanAddressFromCoordinates(latitude: number, longitude: number): Promise<string> {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=ko`;

      const response = await axios.get(url);  //axios 사용하여 url에 get 요청 보내고 응답 받음
      const results = response.data.results;  //응답에서 결과 추출
      //console.log('Result:', JSON.stringify(results, null, 2));

      if (results.length === 0) {
          throw new NotFoundException('No results found');
      }

      //console.log('First result:', JSON.stringify(results[0], null, 2));
      const addressComponents = results[0].formatted_address;
      console.log('Final address:', addressComponents);
      return addressComponents; //한글로 반환된다.
  }
    //GEMINI 위험요소 추출
    async getDangerElements(location: string, 
      nationality: string, 
      birthYear: number,
      sex: string,
      language: string,
      difficulties: string)
    : Promise<{
      location: string, 
      safetyLevel: number, 
      summary: string, 
      detail: {title: string, content: string}[]}> {

      
      const apiKey = process.env.GEMINI_API_KEY;

      //gemini key가 없는 경우
      if (!apiKey) {
        throw new InternalServerErrorException('GEMINI_API_KEY is not set');
      }

      const prompt = this.systemPrompt + "\n" + this.userPromptTemplate
      .replace('{address}', location)
      .replace('{nationality}', nationality)
      .replace('{birth_year}', birthYear.toString())
      .replace('{sex}', sex)
      .replace('{language}', language)
      .replace('{difficulties}', difficulties);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-03-25:generateContent?key=${apiKey}`;

      const response = await axios.post(url, {
        contents: [{parts: [{text: prompt}]}],
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const candidate = response.data.candidates;
      if (!candidate || candidate.length === 0) {
        throw new InternalServerErrorException('No response from Gemini');
      }

      const textRaw = candidate[0].content.parts[0].text.trim();

      let text = textRaw;

      //코드블럭 있으면 제거
      if(text.startsWith('```')){
        text = text.split('\n').slice(1, -1).join('\n').trim();
      }

      //JSON 부분 추출
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}') + 1;
      const jsonText = text.substring(start, end);

      //JSON 파싱
      const json = JSON.parse(jsonText);

      console.log("\n\njson: ", json);

      return json;
    }
    
    //위험정보 반환 
    async getDangerInfo(userId: string, dto: GetLocationDto) {
        const { latitude, longitude } = dto;

        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            }
        });

        if(!user){
          throw new Error('User not found');
        }

        const { nationality, birthYear, sex, language, difficulties } = user;

        //위도, 경도 -> 주소로 변환
        const location = await this.getAddressFromCoordinates(latitude, longitude);

        //GEMINI 위험요소 추출
        const dangerElements = await this.getDangerElements(location, nationality, birthYear, sex, language, difficulties || 'none');

        return dangerElements;
    }

    //현위치 반환 
    async getLocationName(userId: string, dto: GetLocationDto) {
        const { latitude, longitude } = dto;

        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            }
        });

        if(!user){
          throw new NotFoundException('User not found');
        }

        const { language } = user;

        let location: string;
        if(language.toLowerCase() === 'korean'){
          location = await this.getKoreanAddressFromCoordinates(latitude, longitude);
        }
        else{
          location = await this.getAddressFromCoordinates(latitude, longitude);
        }

        return {
            location: location
        };
    }

}
