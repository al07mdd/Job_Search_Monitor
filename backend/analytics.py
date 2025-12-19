import pandas as pd
from datetime import datetime
from typing import Dict
from .storage import VACANCIES_FILE, EVENTS_FILE, ensure_data_files, VACANCY_HEADERS, EVENT_HEADERS
import traceback

def generate_monthly_report(year: int, month: int) -> Dict:
    print(f"DEBUG: Generating report for {year}-{month}")
    
    # 1. Safe default return
    empty_report = {
        "period": f"{year}-{month:02d}",
        "metrics": {
            "new_vacancies_count": 0,
            "activities_count": 0,
            "applications_sent": 0,
            "interviews": 0,
            "offers": 0,
            "rejected": 0,
            "closed": 0
        },
        "recent_activity": []
    }

    try:
        ensure_data_files()
        
        # 2. Try read files safely
        try:
            vacancies_df = pd.read_csv(VACANCIES_FILE)
            if vacancies_df.empty and list(vacancies_df.columns) != VACANCY_HEADERS:
                 vacancies_df = pd.DataFrame(columns=VACANCY_HEADERS)
        except Exception:
            vacancies_df = pd.DataFrame(columns=VACANCY_HEADERS)
            
        try:
            events_df = pd.read_csv(EVENTS_FILE)
            if events_df.empty and list(events_df.columns) != EVENT_HEADERS:
                 events_df = pd.DataFrame(columns=EVENT_HEADERS)
        except Exception:
            events_df = pd.DataFrame(columns=EVENT_HEADERS)

        # 3. Safe Date Conversion
        if not vacancies_df.empty and 'created_at' in vacancies_df.columns:
            vacancies_df['created_at'] = pd.to_datetime(vacancies_df['created_at'], errors='coerce')
            
        if not events_df.empty and 'timestamp' in events_df.columns:
            events_df['timestamp'] = pd.to_datetime(events_df['timestamp'], errors='coerce')

        # 4. Define Period
        try:
            start_date = datetime(year, month, 1)
            if month == 12:
                end_date = datetime(year + 1, 1, 1)
            else:
                end_date = datetime(year, month + 1, 1)
        except ValueError:
            return empty_report

        # 5. Filter Data
        period_events = pd.DataFrame()
        if not events_df.empty and 'timestamp' in events_df.columns:
            # Drop rows with invalid dates
            events_df = events_df.dropna(subset=['timestamp'])
            period_events = events_df[
                (events_df['timestamp'] >= start_date) & 
                (events_df['timestamp'] < end_date)
            ].copy()

        new_vacancies = pd.DataFrame()
        if not vacancies_df.empty and 'created_at' in vacancies_df.columns:
            vacancies_df = vacancies_df.dropna(subset=['created_at'])
            new_vacancies = vacancies_df[
                (vacancies_df['created_at'] >= start_date) & 
                (vacancies_df['created_at'] < end_date)
            ]

        # 6. Calculate Metrics
        metrics = empty_report["metrics"].copy()
        
        metrics["new_vacancies_count"] = len(new_vacancies)
        metrics["activities_count"] = len(period_events)
        
        if not period_events.empty and 'stage_to' in period_events.columns:
            stage_to_safe = period_events['stage_to'].fillna('').astype(str)
            metrics["applications_sent"] = len(stage_to_safe[stage_to_safe == 'applied'])
            metrics["interviews"] = len(stage_to_safe[stage_to_safe == 'interview'])
            metrics["offers"] = len(stage_to_safe[stage_to_safe == 'offer'])
            metrics["rejected"] = len(stage_to_safe[stage_to_safe == 'rejected'])
            metrics["closed"] = len(stage_to_safe[stage_to_safe == 'closed'])

        # 7. Recent Activity (Safe JSON conversion)
        recent_activity = []
        if not period_events.empty:
            period_events['timestamp'] = period_events['timestamp'].dt.strftime('%Y-%m-%dT%H:%M:%S.%f')
            # Replace all NaNs with None/null for valid JSON
            period_events = period_events.map(lambda x: None if pd.isna(x) else x)
            recent_activity = period_events.tail(10).to_dict('records')

        return {
            "period": f"{year}-{month:02d}",
            "metrics": metrics,
            "recent_activity": recent_activity
        }

    except Exception as e:
        print(f"CRITICAL ERROR IN ANALYTICS: {e}")
        traceback.print_exc()
        return empty_report

def generate_csv_export(year: int, month: int) -> str:
    """
    Generates a CSV string containing a detailed activity report.
    Columns: Date, Company, Position, Event/Stage, Comment
    """
    ensure_data_files()
    
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1)
    else:
        end_date = datetime(year, month + 1, 1)

    try:
        vacancies_df = pd.read_csv(VACANCIES_FILE)
        events_df = pd.read_csv(EVENTS_FILE)
        
        # Merge to get company names
        merged = pd.merge(events_df, vacancies_df[['id', 'company', 'position']], left_on='vacancy_id', right_on='id', how='left')
        
        # Filter by date
        merged['timestamp'] = pd.to_datetime(merged['timestamp'], errors='coerce')
        period_data = merged[
            (merged['timestamp'] >= start_date) & 
            (merged['timestamp'] < end_date)
        ].copy()
        
        if period_data.empty:
            return "Date,Company,Position,Activity,Comment\n"
            
        period_data.sort_values('timestamp', inplace=True)
        
        # Prepare export columns
        export_df = pd.DataFrame()
        export_df['Date'] = period_data['timestamp'].dt.strftime('%Y-%m-%d %H:%M')
        export_df['Company'] = period_data['company'].fillna('Unknown')
        export_df['Position'] = period_data['position'].fillna('Unknown')
        
        # Create readable Activity column
        def format_activity(row):
            if row['type'] == 'status_change':
                return f"Status: {row['stage_to']}"
            return row['type'].capitalize()
            
        export_df['Activity'] = period_data.apply(format_activity, axis=1)
        export_df['Comment'] = period_data['comment'].fillna('')
        
        return export_df.to_csv(index=False)
        
    except Exception as e:
        print(f"Export Error: {e}")
        traceback.print_exc()
        return "Error generating report"

def get_monthly_vacancies_summary(year: int, month: int) -> Dict:
    """
    Returns a list of vacancies that were active in the given month,
    with their event history for that month.
    """
    ensure_data_files()
    
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1)
    else:
        end_date = datetime(year, month + 1, 1)

    try:
        # 1. Load data safely
        try:
            vacancies_df = pd.read_csv(VACANCIES_FILE)
        except:
            vacancies_df = pd.DataFrame(columns=VACANCY_HEADERS)
            
        try:
            events_df = pd.read_csv(EVENTS_FILE)
        except:
            events_df = pd.DataFrame(columns=EVENT_HEADERS)

        if vacancies_df.empty:
            return []

        # 2. Filter events by date
        events_df['timestamp'] = pd.to_datetime(events_df['timestamp'], errors='coerce')
        period_events = events_df[
            (events_df['timestamp'] >= start_date) & 
            (events_df['timestamp'] < end_date)
        ].copy()

        # 3. Find relevant vacancy IDs (either created now OR had events now)
        vacancies_df['created_at'] = pd.to_datetime(vacancies_df['created_at'], errors='coerce')
        
        created_in_period = vacancies_df[
            (vacancies_df['created_at'] >= start_date) & 
            (vacancies_df['created_at'] < end_date)
        ]['id'].unique().tolist()
        
        active_in_period = period_events['vacancy_id'].unique().tolist()
        
        relevant_ids = list(set(created_in_period + active_in_period))
        
        # 4. Compile the report
        summary = []
        for vid in relevant_ids:
            # Get vacancy details
            v_row = vacancies_df[vacancies_df['id'] == vid]
            if v_row.empty:
                continue
            v_data = v_row.iloc[0].to_dict()
            
            # Get events for this vacancy IN THIS PERIOD
            v_events = period_events[period_events['vacancy_id'] == vid].sort_values('timestamp')
            
            history = []
            
            # If created in this period, add "Created" event specially
            created_at = v_data.get('created_at')
            if pd.notnull(created_at) and start_date <= created_at < end_date:
                history.append({
                    "date": created_at.strftime("%Y-%m-%d"),
                    "status": "Created",
                    "comment": "Vacancy created"
                })

            for _, evt in v_events.iterrows():
                # Skip creation event if we already added it (sometimes logged as event too)
                if evt['type'] == 'status_change':
                    status = evt['stage_to']
                else:
                    status = evt['type']
                    
                history.append({
                    "date": evt['timestamp'].strftime("%Y-%m-%d"),
                    "status": status,
                    "comment": evt.get('comment', '')
                })
            
            # Deduplicate history if needed or keep all
            
            # Safe handling for NaN values
            def clean_val(v):
                if pd.isna(v):
                    return None
                return v

            summary.append({
                "company": clean_val(v_data.get('company', 'Unknown')),
                "position": clean_val(v_data.get('position', 'Unknown')),
                "current_stage": clean_val(v_data.get('stage', 'Unknown')),
                "history": [{
                    "date": h["date"],
                    "status": clean_val(h["status"]),
                    "comment": clean_val(h["comment"])
                } for h in history]
            })
            
        return summary

    except Exception as e:
        print(f"Detailed Report Error: {e}")
        traceback.print_exc()
        return []
