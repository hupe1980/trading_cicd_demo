#!/usr/bin/env python3
""" Script to create DDL"""
import mysql.connector
import sys
import csv
import os

def populate():
    user = os.environ['DATABASE_ROOT_USER']
    password = os.environ['DATABASE_ROOT_PASSWORD']
    hostname = os.environ['DATABASE_HOST']
    database = os.environ['DATABASE_DB_NAME']
    conn = mysql.connector.connect(user=user,
                                  host=hostname,
                                  database=database,
                                  password=password)
    cursor = conn.cursor()

    airports_csv =  os.path.join(os.path.dirname(__file__), 'airport-codes.csv')

    # check if airports is populated
    cursor.execute("SELECT 1 FROM airport")
    result = cursor.fetchall()
    if not result:
        print("Populating airport")
        with open(airports_csv,'r') as csvfile: 
            reader = csv.DictReader(csvfile)
            airports = [airport for airport in reader]
            for airport in airports:
                sql = """
                INSERT INTO `airport` (ident,type,name,latitude,longitude,elevation_ft,continent,iso_country,iso_region,municipality,gps_code,iata_code,local_code)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s); 
                """
    
                try:
                    cursor.execute(sql, ( airport["ident"], airport["type"], airport["name"], airport["latitude_deg"], airport["longitude_deg"], airport["elevation_ft"], airport["continent"], airport["iso_country"], airport["iso_region"], airport["municipality"], airport["gps_code"], airport["iata_code"], airport["local_code"]  ))
                    conn.commit()
                except:
                    print("Unexpected error! ", sys.exc_info())
                    sys.exit("Error!")
    else:
        print("airport already populated")

    conn.close()
    
populate()
