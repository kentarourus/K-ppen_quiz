import json
from bs4 import BeautifulSoup
import re

def calculate_koppen(temps, precips):
    # This is a simplified Köppen classification for the purpose of the quiz
    if not temps or not precips or len(temps) != 12 or len(precips) != 12:
        return "Unknown"
    
    try:
        temps = [float(t) for t in temps]
        precips = [float(p) for p in precips]
    except ValueError:
        return "Unknown"

    t_mean = sum(temps) / 12
    p_ann = sum(precips)
    p_min = min(precips)
    t_min = min(temps)
    t_max = max(temps)

    # Precipitation threshold for B climates
    # Find percentage of rain in summer (April-Sept in NH, Oct-Mar in SH)
    # Assume Northern Hemisphere for simplicity (or we'd need lat/lon)
    # The JMA list has mostly NH, but some SH. For a rigorous app, we should 
    # look at when the warmest months are.
    
    # Let's say summer is the half year with the higher temperatures
    temp_h1 = sum(temps[3:9]) # Apr-Sep
    temp_h2 = sum(temps[9:12] + temps[0:3]) # Oct-Mar
    
    if temp_h1 > temp_h2:
        # NH
        summer_precip = sum(precips[3:9])
        winter_precip = sum(precips[9:12] + precips[0:3])
        p_wmax = max(precips[9:12] + precips[0:3])
        p_wmin = min(precips[9:12] + precips[0:3])
        p_smax = max(precips[3:9])
        p_smin = min(precips[3:9])
    else:
        # SH
        summer_precip = sum(precips[9:12] + precips[0:3])
        winter_precip = sum(precips[3:9])
        p_smax = max(precips[9:12] + precips[0:3])
        p_smin = min(precips[9:12] + precips[0:3])
        p_wmax = max(precips[3:9])
        p_wmin = min(precips[3:9])

    if summer_precip >= 0.7 * p_ann:
        p_th = 20 * t_mean + 280
    elif winter_precip >= 0.7 * p_ann:
        p_th = 20 * t_mean
    else:
        p_th = 20 * t_mean + 140

    # Type E
    if t_max < 10:
        if t_max < 0:
            return "EF"
        else:
            return "ET"

    # Type B
    if p_ann < p_th:
        if p_ann < 0.5 * p_th:
            if t_mean >= 18:
                return "BWh"
            else:
                return "BWk"
        else:
            if t_mean >= 18:
                return "BSh"
            else:
                return "BSk"

    # Type A
    if t_min >= 18:
        if p_min >= 60:
            return "Af"
        else:
            if p_min >= 100 - (p_ann / 25):
                return "Am"
            else:
                return "Aw"

    # Type C
    if -3 <= t_min < 18:
        if p_smin < 40 and p_smin < p_wmax / 3:
            s_type = "s"
        elif p_wmin < p_smax / 10:
            s_type = "w"
        else:
            s_type = "f"
            
        if t_max >= 22:
            t_type = "a"
        else:
            months_above_10 = sum(1 for t in temps if t >= 10)
            if months_above_10 >= 4:
                t_type = "b"
            else:
                t_type = "c"
        return "C" + s_type + t_type

    # Type D
    if t_min < -3:
        if p_smin < 40 and p_smin < p_wmax / 3:
            s_type = "s"
        elif p_wmin < p_smax / 10:
            s_type = "w"
        else:
            s_type = "f"
            
        if t_max >= 22:
            t_type = "a"
        else:
            months_above_10 = sum(1 for t in temps if t >= 10)
            if months_above_10 >= 4:
                t_type = "b"
            else:
                if t_min < -38:
                    t_type = "d"
                else:
                    t_type = "c"
        return "D" + s_type + t_type
        
    return "Unknown"

def main():
    file_path = r"C:\Users\tarou ken\.gemini\antigravity-ide\brain\4ff39933-72a4-43aa-917e-63d90f63d066\.system_generated\steps\5\content.md"
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    # Extract the HTML part
    start_idx = html_content.find("<!DOCTYPE html")
    if start_idx != -1:
        html_content = html_content[start_idx:]

    soup = BeautifulSoup(html_content, 'html.parser')
    tables = soup.find_all('table', class_='data')
    
    stations_data = []

    for table in tables:
        rows = table.find_all('tr')
        # Skip header
        i = 1
        while i < len(rows):
            tds1 = rows[i].find_all(['td', 'th'])
            if len(tds1) < 15:
                i += 1
                continue
            
            # Extract basic info
            station_name = tds1[0].text.strip()
            country = tds1[1].text.strip()
            
            # The first row contains temperatures
            temps = [td.text.strip() for td in tds1[3:15]]
            
            # The second row contains precipitation
            if i + 1 < len(rows):
                tds2 = rows[i+1].find_all(['td', 'th'])
                precips = [td.text.strip() for td in tds2[1:13]]
            else:
                precips = []
            
            # Clean data (replace '---' with 0 or skip)
            try:
                valid_temps = [float(t) for t in temps if t != '---']
                valid_precips = [float(p) for p in precips if p != '---']
                
                if len(valid_temps) == 12 and len(valid_precips) == 12:
                    koppen = calculate_koppen(valid_temps, valid_precips)
                    stations_data.append({
                        "station": station_name,
                        "country": country,
                        "temperature": valid_temps,
                        "precipitation": valid_precips,
                        "koppen": koppen
                    })
            except Exception as e:
                pass # skip unparseable
                
            i += 2

    # Save to JSON
    with open('climate_data.json', 'w', encoding='utf-8') as f:
        json.dump(stations_data, f, ensure_ascii=False, indent=2)
    
    print(f"Successfully processed {len(stations_data)} stations.")

if __name__ == "__main__":
    main()
